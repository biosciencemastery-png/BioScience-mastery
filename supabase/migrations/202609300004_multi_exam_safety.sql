-- BioScience Mastery
-- Task 3 final safety layer
-- Multi-exam catalogue, entitlement capability and free-test policy.
--
-- IMPORTANT:
-- Existing secure registration trigger/function is intentionally preserved.
-- Normal website validation requires at least one selected examination.

begin;

-- =========================================================
-- 1. GENERAL / SEMESTER WORKSPACE
-- =========================================================

insert into public.examinations (
  slug,
  name,
  name_hi,
  is_public,
  display_order
)
values (
  'semester-college-other',
  'Semester / College / Other Exams',
  'सेमेस्टर / कॉलेज / अन्य परीक्षाएँ',
  true,
  90
)
on conflict (slug)
do update set
  name = excluded.name,
  name_hi = excluded.name_hi,
  is_public = true,
  display_order = excluded.display_order;


-- =========================================================
-- 2. PAID CAPABILITY CHECK
--
-- FREE:
-- No active paid entitlement is required.
--
-- TEST_SERIES:
-- Accessible through TEST_SERIES or COMPLETE_PREP.
--
-- COMPLETE_PREP:
-- Accessible only through COMPLETE_PREP.
--
-- AI_ADDON:
-- Independent entitlement.
-- COMPLETE_PREP does NOT automatically unlock AI.
-- =========================================================

create or replace function public.has_exam_capability(
  p_examination_id uuid,
  p_capability text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$

  select
    case

      when auth.uid() is null then false

      when p_capability = 'TEST_SERIES' then exists (
        select 1
        from public.student_exam_entitlements e
        where e.user_id = auth.uid()
          and e.examination_id = p_examination_id
          and e.status = 'active'
          and (
            e.ends_at is null
            or e.ends_at > now()
          )
          and e.entitlement in (
            'TEST_SERIES',
            'COMPLETE_PREP'
          )
      )

      when p_capability = 'COMPLETE_PREP' then exists (
        select 1
        from public.student_exam_entitlements e
        where e.user_id = auth.uid()
          and e.examination_id = p_examination_id
          and e.status = 'active'
          and (
            e.ends_at is null
            or e.ends_at > now()
          )
          and e.entitlement = 'COMPLETE_PREP'
      )

      when p_capability = 'AI_ADDON' then exists (
        select 1
        from public.student_exam_entitlements e
        where e.user_id = auth.uid()
          and e.examination_id = p_examination_id
          and e.status = 'active'
          and (
            e.ends_at is null
            or e.ends_at > now()
          )
          and e.entitlement = 'AI_ADDON'
      )

      else false

    end;

$$;

revoke all
on function public.has_exam_capability(uuid, text)
from public, anon;

grant execute
on function public.has_exam_capability(uuid, text)
to authenticated;


-- =========================================================
-- 3. FREE CBT ATTEMPT FOUNDATION
--
-- FREE:
-- 1 initial full CBT mock attempt
-- + 1 reattempt
-- = maximum 2 attempts.
--
-- Paid TEST_SERIES or COMPLETE_PREP:
-- unlimited attempts.
--
-- NULL means unlimited.
--
-- This function is policy foundation only.
-- Actual CBT attempt records will be implemented by
-- the common test engine.
-- =========================================================

create or replace function public.exam_mock_attempt_limit(
  p_examination_id uuid
)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$

begin

  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.student_exam_goals g
    where g.user_id = auth.uid()
      and g.examination_id = p_examination_id
      and g.archived_at is null
  ) then
    raise exception 'Examination is not in your workspace';
  end if;

  if public.has_exam_capability(
    p_examination_id,
    'TEST_SERIES'
  ) then
    return null;
  end if;

  return 2;

end;

$$;

revoke all
on function public.exam_mock_attempt_limit(uuid)
from public, anon;

grant execute
on function public.exam_mock_attempt_limit(uuid)
to authenticated;


-- =========================================================
-- 4. SECURITY NOTES
--
-- No client INSERT / UPDATE / DELETE access is added to
-- student_exam_entitlements.
--
-- Existing RLS from migration 0003 remains responsible for
-- allowing students to read only their own entitlements.
--
-- No payment provider is enabled here.
-- No user receives paid access automatically.
-- No AI access is enabled automatically.
--
-- Existing secure registration trigger/function is NOT
-- replaced here. This preserves the existing consent,
-- registration gate and student-only role protections.
-- =========================================================

commit;