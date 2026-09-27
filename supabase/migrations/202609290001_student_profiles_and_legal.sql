begin;
create table public.student_academic_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 details jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
create table public.student_exam_goals (
 user_id uuid not null references auth.users(id) on delete cascade,
 examination_id uuid not null references public.examinations(id),
 target_year integer check(target_year between 2026 and 2200),
 primary key(user_id,examination_id)
);
create table public.legal_policy_versions (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('terms','privacy','refund-policy')),
 locale text not null check(locale in ('en','hi')), version text not null,
 body text not null check(length(btrim(body))>0),
 status text not null default 'draft' check(status in ('draft','published')),
 effective_at timestamptz, reviewed_at timestamptz,
 is_current boolean not null default false,
 unique(kind,locale,version),
 check(status<>'published' or (effective_at is not null and reviewed_at is not null))
);
create unique index current_legal_policy on public.legal_policy_versions(kind,locale) where is_current;
create table public.student_legal_acceptances (
 user_id uuid not null references auth.users(id) on delete cascade,
 policy_id uuid not null references public.legal_policy_versions(id),
 accepted_at timestamptz not null default now(),
 primary key(user_id,policy_id)
);
alter table public.notification_preferences add column marketing_consent boolean not null default false;
alter table public.notification_preferences add column marketing_consent_at timestamptz;
create table private.registration_config(id boolean primary key default true check(id), enabled boolean not null default false);
insert into private.registration_config values(true,false);
revoke all on private.registration_config from public,anon,authenticated;
alter table private.registration_config enable row level security;

create function private.valid_academic_details(d jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare item record;
begin
 if d is null or jsonb_typeof(d)<>'object' then return false; end if;
 for item in select * from jsonb_each(d) loop
  if item.key not in ('phone','gender','gender_description','qualification','specialization','academic_status','academic_year') or jsonb_typeof(item.value)<>'string' or length(item.value#>>'{}')>120 then return false; end if;
 end loop;
 if coalesce(d->>'gender','') not in ('','female','male','nonbinary','prefer_not','self_describe') then return false; end if;
 if d->>'gender'='self_describe' and length(btrim(coalesce(d->>'gender_description','')))=0 then return false; end if;
 if coalesce(d->>'phone','') !~ '^$|^\+?[0-9 ()-]{7,20}$' then return false; end if;
 return true;
end;$$;
alter table public.student_academic_profiles add constraint valid_academic_details check(private.valid_academic_details(details));

create function public.save_student_details(p_details jsonb,p_exams uuid[],p_year integer,p_marketing boolean) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();
begin
 if uid is null or not private.valid_academic_details(p_details) or p_exams is null or p_marketing is null
 or cardinality(p_exams)>20 or cardinality(p_exams)<>(select count(distinct x) from unnest(p_exams) x)
 or (p_year is not null and (p_year<extract(year from now()) or p_year>extract(year from now())+15))
 or exists(select 1 from unnest(p_exams) x where not exists(select 1 from public.examinations e where e.id=x and e.is_public)) then raise exception 'Invalid student details'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text,4));
 insert into public.student_academic_profiles(user_id,details) values(uid,p_details)
 on conflict(user_id) do update set details=excluded.details,updated_at=now();
 delete from public.student_exam_goals where user_id=uid;
 insert into public.student_exam_goals select uid,x,p_year from unnest(p_exams) x;
 update public.notification_preferences set marketing_consent=p_marketing,marketing_consent_at=case when marketing_consent is distinct from p_marketing then now() else marketing_consent_at end where user_id=uid;
end;$$;

-- Runs in the Auth insert transaction: consent and optional details either all persist or signup fails.
-- The separate database gate also blocks direct Auth API signups that bypass Next.js.
create function private.capture_student_registration() returns trigger
language plpgsql security definer set search_path='' as $$
declare r jsonb:=new.raw_user_meta_data->'student_registration'; p public.legal_policy_versions; exam uuid; ids uuid[]; pid uuid; count_policies integer:=0;
begin
 if not exists(select 1 from private.registration_config where enabled) then raise exception 'Registration is not open'; end if;
 if r is null or r->'terms' is distinct from 'true'::jsonb or r->'privacy' is distinct from 'true'::jsonb or not private.valid_academic_details(r->'details')
 or coalesce(new.raw_user_meta_data->>'locale','') not in ('en','hi')
 or jsonb_typeof(r->'exam_ids') is distinct from 'array' or jsonb_array_length(r->'exam_ids')>20
 or jsonb_typeof(r->'marketing') is distinct from 'boolean' then raise exception 'Registration consent or profile missing'; end if;
 if coalesce(r->>'terms','')<>'true' or coalesce(r->>'privacy','')<>'true' then raise exception 'Consent required'; end if;
 foreach pid in array array[(r->>'terms_version')::uuid,(r->>'privacy_version')::uuid] loop
  select * into p from public.legal_policy_versions where id=pid and locale=new.raw_user_meta_data->>'locale'
    and is_current and status='published' and effective_at<=now();
  if p.id is null or (count_policies=0 and p.kind<>'terms') or (count_policies=1 and p.kind<>'privacy') then raise exception 'Current published policies required'; end if;
  insert into public.student_legal_acceptances(user_id,policy_id) values(new.id,p.id);
  count_policies:=count_policies+1;
 end loop;
 select coalesce(array_agg(value::uuid),'{}'::uuid[]) into ids from jsonb_array_elements_text(r->'exam_ids');
 if cardinality(ids)<>(select count(distinct x) from unnest(ids) x) then raise exception 'Duplicate goals'; end if;
 insert into public.student_academic_profiles(user_id,details) values(new.id,r->'details');
 foreach exam in array ids loop
  if not exists(select 1 from public.examinations where id=exam and is_public) then raise exception 'Unknown examination'; end if;
  insert into public.student_exam_goals values(new.id,exam,(r->>'target_year')::integer);
 end loop;
 if r->>'target_year' is not null and ((r->>'target_year')::integer<extract(year from now()) or (r->>'target_year')::integer>extract(year from now())+15) then raise exception 'Invalid target year'; end if;
 update public.notification_preferences set marketing_consent=(r->>'marketing')::boolean,marketing_consent_at=now() where user_id=new.id;
 -- Remove the temporary copy from editable Auth metadata. Authoritative records are the tables above.
 update auth.users set raw_user_meta_data=raw_user_meta_data-'student_registration' where id=new.id;
 return new;
end;$$;
create trigger phase4_student_registration after insert on auth.users for each row execute function private.capture_student_registration();

create function private.protect_published_policy() returns trigger language plpgsql set search_path='' as $$
begin
 if old.status='published' and (new.body,new.kind,new.locale,new.version,new.effective_at,new.reviewed_at,new.status) is distinct from (old.body,old.kind,old.locale,old.version,old.effective_at,old.reviewed_at,old.status) then raise exception 'Published policy versions are immutable; create a new version'; end if;
 return new;
end;$$;
create trigger immutable_published_policy before update on public.legal_policy_versions for each row execute function private.protect_published_policy();
alter table public.student_academic_profiles enable row level security;
alter table public.student_exam_goals enable row level security;
alter table public.legal_policy_versions enable row level security;
alter table public.student_legal_acceptances enable row level security;
revoke all on public.student_academic_profiles,public.student_exam_goals,public.legal_policy_versions,public.student_legal_acceptances from public,anon,authenticated;
grant select on public.student_academic_profiles,public.student_exam_goals,public.student_legal_acceptances to authenticated;
grant select on public.legal_policy_versions to anon,authenticated;
create policy own_academic on public.student_academic_profiles for select to authenticated using(user_id=auth.uid());
create policy own_goals on public.student_exam_goals for select to authenticated using(user_id=auth.uid());
create policy own_acceptances on public.student_legal_acceptances for select to authenticated using(user_id=auth.uid());
create policy published_policies on public.legal_policy_versions for select to anon,authenticated using(status='published' and effective_at<=now());
revoke all on function public.save_student_details(jsonb,uuid[],integer,boolean) from public,anon;
grant execute on function public.save_student_details(jsonb,uuid[],integer,boolean) to authenticated;
revoke all on function private.capture_student_registration(),private.valid_academic_details(jsonb),private.protect_published_policy() from public,anon,authenticated;
commit;
