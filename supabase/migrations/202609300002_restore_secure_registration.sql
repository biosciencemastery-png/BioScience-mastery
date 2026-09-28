-- Repair manually altered Auth bootstrap functions using the original source definitions.
-- Does not enable signup, change existing accounts/roles, or publish policies.
begin;
create or replace function private.handle_new_user() returns trigger
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
create or replace function private.capture_student_registration() returns trigger
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

drop trigger if exists bioscience_new_user on auth.users;
create trigger bioscience_new_user after insert on auth.users for each row execute function private.handle_new_user();
drop trigger if exists phase4_student_registration on auth.users;
create trigger phase4_student_registration after insert on auth.users for each row execute function private.capture_student_registration();
revoke all on function private.handle_new_user(), private.capture_student_registration() from public,anon,authenticated;
commit;
