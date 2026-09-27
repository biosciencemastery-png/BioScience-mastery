begin;
create table public.examinations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  examination_id uuid not null references public.examinations(id),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  launch_status text not null default 'coming_soon' check (launch_status in ('coming_soon','in_preparation','published','archived')),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
create index courses_examination_id on public.courses(examination_id);

-- Private preparation for a later consent-based launch-alert workflow.
-- No anonymous API read/write grants; no subscription UI is enabled by this migration.
create table public.course_interest_subscriptions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  email_normalized text not null check (email_normalized = lower(btrim(email_normalized)) and char_length(email_normalized) between 3 and 254),
  locale text not null default 'en' check (locale in ('en','hi')),
  status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed')),
  consent_version text not null,
  consent_recorded_at timestamptz not null default now(),
  confirmation_token_hash text,
  unsubscribe_token_hash text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  unique (course_id, email_normalized)
);
create index subscriptions_launch_queue on public.course_interest_subscriptions(course_id, status);
alter table public.examinations enable row level security;
alter table public.courses enable row level security;
alter table public.course_interest_subscriptions enable row level security;
revoke all on public.examinations, public.courses, public.course_interest_subscriptions from anon, authenticated;
grant select on public.examinations, public.courses to anon, authenticated;
create policy exams_public on public.examinations for select to anon, authenticated using (is_public);
create policy courses_public on public.courses for select to anon, authenticated using (is_public and exists (select 1 from public.examinations e where e.id = examination_id and e.is_public));

insert into public.examinations(slug, name, is_public) values
  ('gat-b','Graduate Aptitude Test – Biotechnology',true), ('cuet-pg','CUET-PG',true),
  ('csir-net','CSIR-UGC NET Life Sciences',true), ('gate-biotechnology','GATE Biotechnology',true),
  ('dbt-bet','DBT-BET',true), ('phd-entrances','Relevant PhD entrance examinations',true);
insert into public.courses(examination_id, slug, title, launch_status, is_public)
select id, slug, name, case when slug = 'gat-b' then 'in_preparation' else 'coming_soon' end, true from public.examinations;
commit;
