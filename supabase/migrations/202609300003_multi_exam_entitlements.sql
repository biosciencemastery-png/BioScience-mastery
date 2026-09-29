-- BioScience Mastery
-- Task 3: Multi-Exam Workspace + Premium Access Foundation
-- Additive migration: preserves existing student exam history.

begin;

-- =========================================================
-- 1. MULTI-EXAM WORKSPACE
-- =========================================================

alter table public.student_exam_goals
  add column if not exists is_active boolean not null default false,
  add column if not exists archived_at timestamptz;

-- Existing users may already have exam goals.
-- If they do not have an active exam, choose one existing goal.
with ranked as (
  select
    user_id,
    examination_id,
    row_number() over (
      partition by user_id
      order by examination_id
    ) as rn
  from public.student_exam_goals
  where archived_at is null
)
update public.student_exam_goals g
set is_active = true
from ranked r
where g.user_id = r.user_id
  and g.examination_id = r.examination_id
  and r.rn = 1
  and not exists (
    select 1
    from public.student_exam_goals x
    where x.user_id = g.user_id
      and x.is_active = true
      and x.archived_at is null
  );

create unique index if not exists one_active_exam_per_student
on public.student_exam_goals(user_id)
where is_active = true and archived_at is null;


-- =========================================================
-- 2. EXAM-SPECIFIC PREMIUM ENTITLEMENTS
-- =========================================================

create table if not exists public.student_exam_entitlements (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  examination_id uuid not null
    references public.examinations(id),

  entitlement text not null
    check (
      entitlement in (
        'TEST_SERIES',
        'COMPLETE_PREP',
        'AI_ADDON'
      )
    ),

  status text not null default 'active'
    check (
      status in (
        'active',
        'expired',
        'revoked'
      )
    ),

  starts_at timestamptz not null default now(),
  ends_at timestamptz,

  granted_by uuid
    references auth.users(id),

  created_at timestamptz not null default now(),

  check (
    ends_at is null
    or ends_at > starts_at
  )
);

create unique index if not exists active_exam_entitlement
on public.student_exam_entitlements(
  user_id,
  examination_id,
  entitlement
)
where status = 'active';


-- =========================================================
-- 3. SECURITY
-- Students can READ their entitlement.
-- Students cannot INSERT/UPDATE/DELETE paid access.
-- =========================================================

alter table public.student_exam_entitlements
enable row level security;

revoke all
on public.student_exam_entitlements
from public, anon, authenticated;

grant select
on public.student_exam_entitlements
to authenticated;

drop policy if exists own_entitlements
on public.student_exam_entitlements;

create policy own_entitlements
on public.student_exam_entitlements
for select
to authenticated
using (user_id = auth.uid());


-- =========================================================
-- 4. ACTIVE EXAM SWITCHER
-- =========================================================

create or replace function
public.set_active_student_exam(
  p_examination_id uuid
)
returns void

language plpgsql
security definer
set search_path = ''

as $$

declare
  uid uuid := auth.uid();

begin

  if uid is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.student_exam_goals
    where user_id = uid
      and examination_id = p_examination_id
      and archived_at is null
  ) then
    raise exception 'Examination is not in your workspace';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(uid::text, 5)
  );

  update public.student_exam_goals
  set is_active = (examination_id = p_examination_id)
  where user_id = uid
    and archived_at is null;

end;

$$;


-- =========================================================
-- 5. ARCHIVE EXAM
-- Never delete learning/test history.
-- At least one active workspace exam must remain.
-- =========================================================

create or replace function
public.archive_student_exam(
  p_examination_id uuid
)
returns void

language plpgsql
security definer
set search_path = ''

as $$

declare
  uid uuid := auth.uid();
  remaining integer;

begin

  if uid is null then
    raise exception 'Authentication required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(uid::text, 6)
  );

  select count(*)
  into remaining
  from public.student_exam_goals
  where user_id = uid
    and archived_at is null;

  if remaining <= 1 then
    raise exception 'At least one examination must remain';
  end if;

  if not exists (
    select 1
    from public.student_exam_goals
    where user_id = uid
      and examination_id = p_examination_id
      and archived_at is null
  ) then
    raise exception 'Unknown workspace examination';
  end if;

  update public.student_exam_goals
  set
    archived_at = now(),
    is_active = false
  where user_id = uid
    and examination_id = p_examination_id;

  -- If archived exam was active, select another exam.
  if not exists (
    select 1
    from public.student_exam_goals
    where user_id = uid
      and is_active = true
      and archived_at is null
  ) then

    update public.student_exam_goals
    set is_active = true
    where user_id = uid
      and archived_at is null
      and examination_id = (
        select examination_id
        from public.student_exam_goals
        where user_id = uid
          and archived_at is null
        order by examination_id
        limit 1
      );

  end if;

end;

$$;


-- =========================================================
-- 6. SAFE PROFILE / EXAM GOAL SAVE
--
-- IMPORTANT:
-- Existing goals are archived instead of deleted.
-- History remains available.
-- Paid entitlements are untouched.
-- At least one exam is required.
-- =========================================================

create or replace function
public.save_student_details(
  p_details jsonb,
  p_exams uuid[],
  p_year integer,
  p_marketing boolean
)
returns void

language plpgsql
security definer
set search_path = ''

as $$

declare
  uid uuid := auth.uid();
  exam_id uuid;

begin

  if uid is null
    or not private.valid_academic_details(p_details)
    or p_exams is null
    or cardinality(p_exams) < 1
    or cardinality(p_exams) > 20
    or p_marketing is null
    or cardinality(p_exams) <> (
      select count(distinct x)
      from unnest(p_exams) x
    )
    or (
      p_year is not null
      and (
        p_year < extract(year from now())
        or p_year > extract(year from now()) + 15
      )
    )
    or exists (
      select 1
      from unnest(p_exams) x
      where not exists (
        select 1
        from public.examinations e
        where e.id = x
          and e.is_public
      )
    )
  then
    raise exception 'Invalid student details';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(uid::text, 4)
  );

  insert into public.student_academic_profiles(
    user_id,
    details
  )
  values (
    uid,
    p_details
  )

  on conflict(user_id)
  do update set
    details = excluded.details,
    updated_at = now();


  -- Add/reactivate selected examinations.
  foreach exam_id in array p_exams
  loop

    insert into public.student_exam_goals(
      user_id,
      examination_id,
      target_year,
      is_active,
      archived_at
    )

    values (
      uid,
      exam_id,
      p_year,
      false,
      null
    )

    on conflict(user_id, examination_id)
    do update set
      target_year = excluded.target_year,
      archived_at = null;

  end loop;


  -- Exams removed from profile become archived.
  update public.student_exam_goals
  set
    archived_at = now(),
    is_active = false
  where user_id = uid
    and archived_at is null
    and not (examination_id = any(p_exams));


  -- Guarantee exactly one active exam.
  if not exists (
    select 1
    from public.student_exam_goals
    where user_id = uid
      and is_active = true
      and archived_at is null
  ) then

    update public.student_exam_goals
    set is_active = true
    where user_id = uid
      and examination_id = p_exams[1]
      and archived_at is null;

  end if;


  update public.notification_preferences
  set
    marketing_consent = p_marketing,

    marketing_consent_at =
      case
        when marketing_consent is distinct from p_marketing
          then now()
        else marketing_consent_at
      end

  where user_id = uid;

end;

$$;


-- =========================================================
-- 7. FUNCTION PERMISSIONS
-- =========================================================

revoke all
on function public.set_active_student_exam(uuid)
from public, anon;

revoke all
on function public.archive_student_exam(uuid)
from public, anon;

grant execute
on function public.set_active_student_exam(uuid)
to authenticated;

grant execute
on function public.archive_student_exam(uuid)
to authenticated;


commit;