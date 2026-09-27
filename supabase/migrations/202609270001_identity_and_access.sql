-- Phase 2 foundation. Review and apply to a development project first.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  preferred_language text not null default 'en' check (preferred_language in ('en','hi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('student','editor','admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
create table public.role_permissions (
  role text not null check (role in ('student','editor','admin')),
  permission text not null,
  primary key (role, permission)
);
insert into public.role_permissions values
  ('student','account.manage_own'), ('editor','content.review'), ('admin','platform.manage');

create function public.has_role(required_role text) returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = required_role) $$;
revoke all on function public.has_role(text) from public, anon;
grant execute on function public.has_role(text) to authenticated;

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  optional_exam_reminders boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'requested' check (status in ('requested','processing','completed','cancelled')),
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  check (processed_at is null or status in ('completed','cancelled'))
);
create unique index one_active_deletion_request_per_user
  on public.account_deletion_requests(user_id) where status in ('requested','processing');
create index deletion_request_queue on public.account_deletion_requests(status, created_at);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  target_user_id uuid,
  action text not null,
  resource text not null,
  created_at timestamptz not null default now()
);
create index audit_logs_created_at on public.audit_logs(created_at desc);

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profile_updated before update on public.profiles for each row execute function private.touch_updated_at();
create trigger preferences_updated before update on public.notification_preferences for each row execute function private.touch_updated_at();

create function private.audit_account_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_logs(actor_id, target_user_id, action, resource)
  values (auth.uid(), case when TG_OP = 'DELETE' then old.user_id else new.user_id end, TG_OP, TG_TABLE_NAME);
  return null;
end;
$$;
create trigger role_audit after insert or update or delete on public.user_roles for each row execute function private.audit_account_change();
create trigger deletion_audit after insert or update on public.account_deletion_requests for each row execute function private.audit_account_change();

create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name, preferred_language) values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), 'Learner'), 80),
    case when new.raw_user_meta_data ->> 'locale' = 'hi' then 'hi' else 'en' end
  );
  insert into public.user_roles(user_id, role) values (new.id, 'student');
  insert into public.notification_preferences(user_id) values (new.id);
  return new;
end;
$$;
create trigger bioscience_new_user after insert on auth.users for each row execute function private.handle_new_user();

-- Existing Auth accounts are backfilled without trusting role claims in user metadata.
insert into public.profiles(id, display_name, preferred_language)
select id, left(coalesce(nullif(btrim(raw_user_meta_data ->> 'display_name'), ''), 'Learner'), 80),
  case when raw_user_meta_data ->> 'locale' = 'hi' then 'hi' else 'en' end
from auth.users on conflict (id) do nothing;
insert into public.user_roles(user_id, role) select id, 'student' from auth.users on conflict do nothing;
insert into public.notification_preferences(user_id) select id from auth.users on conflict do nothing;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.profiles, public.user_roles, public.role_permissions, public.notification_preferences,
  public.account_deletion_requests, public.audit_logs from anon, authenticated;
grant select on public.profiles, public.user_roles, public.role_permissions, public.notification_preferences,
  public.account_deletion_requests, public.audit_logs to authenticated;
grant update(display_name, preferred_language) on public.profiles to authenticated;
grant update(optional_exam_reminders) on public.notification_preferences to authenticated;
grant insert(user_id) on public.account_deletion_requests to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (id = (select auth.uid()) or public.has_role('admin'));
create policy profiles_update_own on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy roles_read on public.user_roles for select to authenticated using (user_id = (select auth.uid()) or public.has_role('admin'));
create policy permissions_read on public.role_permissions for select to authenticated using (true);
create policy preferences_read on public.notification_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy preferences_update on public.notification_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy deletion_read on public.account_deletion_requests for select to authenticated using (user_id = (select auth.uid()) or public.has_role('admin'));
create policy deletion_request_own on public.account_deletion_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'requested' and processed_at is null);
create policy audit_read_admin on public.audit_logs for select to authenticated using (public.has_role('admin'));
revoke all on all functions in schema private from public, anon, authenticated;
commit;
