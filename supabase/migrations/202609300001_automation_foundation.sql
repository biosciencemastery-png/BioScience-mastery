-- Phase 5: private, review-first automation. No scheduler, network or delivery hooks.
create table private.automation_config (
  singleton boolean primary key default true check (singleton),
  manual_collection_enabled boolean not null default false,
  publication_enabled boolean not null default false
);
insert into private.automation_config default values;
create table private.automation_allowed_origins (
  origin text primary key check (origin ~ '^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?$'),
  review_notes text not null check (length(trim(review_notes)) between 10 and 2000)
);
-- Operator-controlled, deliberately empty. Staff cannot approve new origins or activate services.
revoke all on private.automation_config, private.automation_allowed_origins from public, anon, authenticated;

create table public.automation_sources (
  id uuid primary key default gen_random_uuid(),
  examination_id uuid not null references public.examinations(id),
  name text not null check (length(trim(name)) between 2 and 160),
  url text not null unique check (length(url) <= 2048),
  source_type text not null check (source_type in ('notice','website','syllabus','document')),
  active boolean not null default false,
  verification_status text not null default 'needs_review' check (verification_status in ('needs_review','verified')),
  verification_notes text not null default '' check (length(verification_notes) <= 2000),
  licensing_notes text not null check (length(trim(licensing_notes)) between 2 and 2000),
  stale_after_hours integer not null default 168 check (stale_after_hours between 1 and 8760),
  last_checked_at timestamptz,
  last_success_at timestamptz,
  fingerprint text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.automation_sources(id),
  idempotency_key uuid not null unique,
  status text not null default 'queued' check (status in ('queued','leased','succeeded','failed')),
  attempts integer not null default 0 check (attempts between 0 and 3),
  lease_token uuid,
  lease_until timestamptz,
  actor uuid references auth.users(id) on delete set null,
  result text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.automation_evidence (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.automation_sources(id),
  job_id uuid not null references public.automation_jobs(id),
  attempt integer not null,
  source_url text not null,
  retrieved_at timestamptz not null default now(),
  fingerprint text,
  previous_fingerprint text,
  excerpt text not null check (length(excerpt) between 1 and 12000),
  change_type text not null check (change_type in ('initial','changed','retrieval_failure')),
  language text not null check (language in ('en','hi')),
  verification_status text not null default 'unverified' check (verification_status = 'unverified'),
  licensing_notes text not null,
  collection_method text not null default 'manual_development' check (collection_method = 'manual_development'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id,attempt)
);
create table public.automation_reviews (
  id uuid primary key default gen_random_uuid(),
  evidence_id uuid not null unique references public.automation_evidence(id),
  status text not null default 'detected' check (status in ('detected','needs_review','verified','draft','approved','rejected','published')),
  category text not null default 'notice' check (category in ('notice','ambiguous_date','contradiction','retrieval_failure','deadline_change','security_incident','owner_approval')),
  verification_notes text not null default '',
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  current_revision_id uuid,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.automation_revisions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.automation_reviews(id),
  evidence_id uuid not null references public.automation_evidence(id),
  revision integer not null,
  title text not null check (length(trim(title)) between 2 and 200),
  body text not null check (length(trim(body)) between 10 and 12000),
  language text not null check (language in ('en','hi')),
  source_url text not null,
  licensing_notes text not null check (length(trim(licensing_notes)) between 2 and 2000),
  rights_confirmed boolean not null check (rights_confirmed),
  verification_status text not null check (verification_status = 'verified'),
  attribution text not null default 'BioScience Mastery summary; not an official notice or endorsement.',
  author uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(review_id, revision),
  unique(review_id, id)
);
alter table public.automation_reviews add constraint automation_current_revision
  foreign key (id,current_revision_id) references public.automation_revisions(review_id,id);
create table public.automation_decisions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.automation_reviews(id),
  revision_id uuid references public.automation_revisions(id),
  decision text not null check (decision in ('approved','rejected','published')),
  reason text not null check (length(trim(reason)) between 10 and 2000),
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.automation_history (
  id bigint generated always as identity primary key,
  entity_id uuid not null,
  action text not null,
  previous_status text,
  next_status text,
  notes text not null default '',
  actor uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index automation_jobs_source_idx on public.automation_jobs(source_id,created_at desc);
create index automation_reviews_status_idx on public.automation_reviews(status,updated_at desc);
create index automation_history_entity_idx on public.automation_history(entity_id,id);

do $$ declare t text; begin
  foreach t in array array['automation_sources','automation_jobs','automation_evidence','automation_reviews','automation_revisions','automation_decisions','automation_history'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('create policy automation_staff_read on public.%I for select to authenticated using (public.has_role(''admin'') or public.has_role(''editor''))',t);
  end loop;
end $$;

create function private.automation_audit(entity uuid, action text, previous text, next text, notes text default '')
returns void language sql security definer set search_path = '' as $$
  insert into public.automation_history(entity_id,action,previous_status,next_status,notes,actor)
  values(entity,action,previous,next,left(notes,2000),auth.uid());
$$;
revoke all on function private.automation_audit(uuid,text,text,text,text) from public,anon,authenticated;

-- One validated mutation boundary; JWT metadata is never an authorization source.
create function public.automation_command(command text, payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  admin boolean := public.has_role('admin');
  s public.automation_sources;
  j public.automation_jobs;
  e public.automation_evidence;
  r public.automation_reviews;
  config private.automation_config;
  approved_origin text;
  body text;
  digest text;
  kind text;
  next_state text;
  new_id uuid;
  revision_no integer;
begin
  if auth.uid() is null or not (admin or public.has_role('editor')) then
    raise exception 'Automation staff access required' using errcode='42501';
  end if;
  if payload is null or jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 100000 then raise exception 'Invalid input'; end if;
  select * into config from private.automation_config where singleton;
  if command = 'source' then
    if not admin then raise exception 'Administrator required' using errcode='42501'; end if;
    approved_origin := substring(payload->>'url' from '^(https://[a-z0-9.-]+)(/|$)');
    if approved_origin is null or payload->>'url' !~ '^https://[a-z0-9.-]+(/[a-zA-Z0-9/_~.%-]*)?$'
      or payload->>'url' ~* '/(\.|%2e){1,2}(/|$)'
      or not exists(select 1 from private.automation_allowed_origins a where a.origin=approved_origin)
      then raise exception 'Source origin requires operator approval'; end if;
    if payload->>'verification_status' = 'verified' and length(trim(coalesce(payload->>'verification_notes',''))) < 10 then raise exception 'Verification notes required'; end if;
    if nullif(payload->>'id','') is null then
      insert into public.automation_sources(examination_id,name,url,source_type,active,verification_status,verification_notes,licensing_notes)
      values((payload->>'examination_id')::uuid,payload->>'name',payload->>'url',payload->>'source_type',coalesce((payload->>'active')::boolean,false),payload->>'verification_status',coalesce(payload->>'verification_notes',''),payload->>'licensing_notes') returning * into s;
    else
      update public.automation_sources set name=payload->>'name', active=(payload->>'active')::boolean,
        verification_status=payload->>'verification_status',verification_notes=coalesce(payload->>'verification_notes',''),licensing_notes=payload->>'licensing_notes',version=version+1,updated_at=now()
      where id=(payload->>'id')::uuid and version=(payload->>'version')::integer
        and url=payload->>'url' and examination_id=(payload->>'examination_id')::uuid and source_type=payload->>'source_type' returning * into s;
      if s.id is null then raise exception 'Source changed; reload (URL, exam and type are immutable)'; end if;
    end if;
    perform private.automation_audit(s.id,'source',null,s.verification_status,s.verification_notes);
    return jsonb_build_object('id',s.id);
  elsif command in ('claim','complete','failure') then
    if not admin then raise exception 'Administrator required' using errcode='42501'; end if;
    if not config.manual_collection_enabled then raise exception 'Collection kill switch is off'; end if;
    if command = 'claim' then
      select * into s from public.automation_sources where id=(payload->>'source_id')::uuid for update;
      if s.id is null or not s.active or s.verification_status <> 'verified' then raise exception 'Active verified source required'; end if;
      if not exists(select 1 from private.automation_allowed_origins a where a.origin=substring(s.url from '^(https://[a-z0-9.-]+)(/|$)')) then raise exception 'Source origin approval revoked'; end if;
      insert into public.automation_jobs(source_id,idempotency_key) values(s.id,(payload->>'idempotency_key')::uuid) on conflict(idempotency_key) do nothing;
      select * into j from public.automation_jobs where idempotency_key=(payload->>'idempotency_key')::uuid for update;
      if j.source_id <> s.id then raise exception 'Idempotency key belongs to another source'; end if;
      if j.status = 'succeeded' then return jsonb_build_object('id',j.id,'result',j.result,'finished',true); end if;
      if j.attempts >= 3 or (j.status='leased' and j.lease_until > now()) then raise exception 'Job unavailable or retry limit reached'; end if;
      update public.automation_jobs set status='leased',attempts=attempts+1,actor=auth.uid(),lease_token=gen_random_uuid(),lease_until=now()+interval '5 minutes',updated_at=now() where id=j.id returning * into j;
      perform private.automation_audit(j.id,'claim',null,'leased');
      return jsonb_build_object('id',j.id,'lease_token',j.lease_token,'finished',false);
    end if;
    select * into j from public.automation_jobs where id=(payload->>'job_id')::uuid for update;
    if j.id is null or j.status <> 'leased' or j.lease_until <= now() or j.lease_token is distinct from (payload->>'lease_token')::uuid or j.actor is distinct from auth.uid() then raise exception 'Valid owned lease required'; end if;
    select * into s from public.automation_sources where id=j.source_id for update;
    if not s.active or s.verification_status <> 'verified' then raise exception 'Source disabled'; end if;
    if not exists(select 1 from private.automation_allowed_origins a where a.origin=substring(s.url from '^(https://[a-z0-9.-]+)(/|$)')) then raise exception 'Source origin approval revoked'; end if;
    body := trim(replace(replace(coalesce(payload->>'text',''),E'\r\n',E'\n'),E'\r',E'\n'));
    if length(body) not between 1 and 12000 or coalesce(payload->>'language','') not in ('en','hi') then raise exception 'Valid bounded evidence and language required'; end if;
    update public.automation_sources set last_checked_at=now(),updated_at=now() where id=s.id;
    if command = 'failure' then kind := 'retrieval_failure';
    else
      digest := encode(sha256(convert_to(body,'UTF8')),'hex');
      kind := case when s.fingerprint is null then 'initial' when s.fingerprint=digest then 'unchanged' else 'changed' end;
      update public.automation_sources set last_success_at=now(),fingerprint=digest where id=s.id;
    end if;
    if kind <> 'unchanged' then
      insert into public.automation_evidence(source_id,job_id,attempt,source_url,fingerprint,previous_fingerprint,excerpt,change_type,language,licensing_notes)
      values(s.id,j.id,j.attempts,s.url,digest,s.fingerprint,body,kind,payload->>'language',s.licensing_notes) returning * into e;
      insert into public.automation_reviews(evidence_id,category) values(e.id,case when kind='retrieval_failure' then kind else 'notice' end) returning * into r;
      perform private.automation_audit(r.id,'detected',null,'detected');
    end if;
    update public.automation_jobs set status=case when command='failure' then 'failed' else 'succeeded' end,result=kind,lease_token=null,lease_until=null,updated_at=now() where id=j.id;
    perform private.automation_audit(j.id,'complete','leased',kind);
    return jsonb_build_object('result',kind,'review_id',r.id);
  elsif command in ('triage','draft','approve','reject','publish') then
    select * into r from public.automation_reviews where id=(payload->>'id')::uuid for update;
    if r.id is null or r.version is distinct from (payload->>'version')::integer then raise exception 'Review changed; reload'; end if;
    select * into e from public.automation_evidence where id=r.evidence_id;
    if r.status='published' then raise exception 'Published review is immutable; collect new evidence'; end if;
    if command='triage' then
      next_state := payload->>'status';
      if r.status not in ('detected','needs_review','verified','rejected') or next_state not in ('needs_review','verified') or length(trim(coalesce(payload->>'notes',''))) not between 10 and 2000 then raise exception 'Invalid review transition or verification notes'; end if;
      if next_state='verified' and e.change_type='retrieval_failure' then raise exception 'Failure cannot verify examination information'; end if;
      update public.automation_reviews set category=payload->>'category',verification_notes=payload->>'notes',verified_at=case when next_state='verified' then now() else null end,verified_by=case when next_state='verified' then auth.uid() else null end where id=r.id;
    elsif command='draft' then
      if r.status not in ('verified','draft','approved') or r.verified_at is null then raise exception 'Verified evidence required'; end if;
      select coalesce(max(revision),0)+1 into revision_no from public.automation_revisions where review_id=r.id;
      insert into public.automation_revisions(review_id,evidence_id,revision,title,body,language,source_url,licensing_notes,rights_confirmed,verification_status,author)
      values(r.id,e.id,revision_no,payload->>'title',payload->>'body',payload->>'language',e.source_url,payload->>'licensing_notes',coalesce((payload->>'rights_confirmed')::boolean,false),'verified',auth.uid()) returning id into new_id;
      update public.automation_reviews set current_revision_id=new_id where id=r.id;
      next_state := 'draft'; -- Any new revision invalidates the current approval, retaining its history.
    else
      if not admin then raise exception 'Administrator required' using errcode='42501'; end if;
      if length(trim(coalesce(payload->>'notes',''))) not between 10 and 2000 then raise exception 'Decision reason required'; end if;
      if command='approve' then
        if r.status <> 'draft' or r.current_revision_id is null then raise exception 'Draft required'; end if;
        next_state := 'approved';
      elsif command='reject' then next_state := 'rejected';
      else
        if not config.publication_enabled then raise exception 'Publication kill switch is off'; end if;
        if r.status <> 'approved' or not exists(select 1 from public.automation_decisions d where d.review_id=r.id and d.revision_id=r.current_revision_id and d.decision='approved') then raise exception 'Approved revision required'; end if;
        next_state := 'published';
      end if;
      insert into public.automation_decisions(review_id,revision_id,decision,reason,actor) values(r.id,r.current_revision_id,next_state,payload->>'notes',auth.uid());
    end if;
    update public.automation_reviews set status=next_state,version=version+1,updated_at=now() where id=r.id;
    perform private.automation_audit(r.id,command,r.status,next_state,coalesce(payload->>'notes',''));
    return jsonb_build_object('id',r.id,'status',next_state);
  end if;
  raise exception 'Unknown automation command';
end $$;
revoke all on function public.automation_command(text,jsonb) from public,anon;
grant execute on function public.automation_command(text,jsonb) to authenticated;

create function public.automation_dashboard()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb; begin
  if auth.uid() is null or not (public.has_role('admin') or public.has_role('editor')) then raise exception 'Automation staff access required' using errcode='42501'; end if;
  select jsonb_build_object(
    'is_admin',public.has_role('admin'),
    'collection_enabled',(select manual_collection_enabled from private.automation_config where singleton),
    'publication_enabled',(select publication_enabled from private.automation_config where singleton),
    'external_ai_enabled',false,'delivery_enabled',false,'scheduler_enabled',false,'actual_cost',0,
    'examinations',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'name_hi',name_hi) order by display_order),'[]'::jsonb) from public.examinations),
    'sources',(select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) from (select s.*,case when not active then 'inactive' when last_success_at is null then 'never_checked' when last_success_at < now()-make_interval(hours=>stale_after_hours) then 'stale' else 'fresh' end freshness from public.automation_sources s order by created_at desc limit 100) x),
    'reviews',(select coalesce(jsonb_agg(to_jsonb(x) order by x.updated_at desc),'[]'::jsonb) from (select r.*,e.source_url,e.excerpt,e.change_type,e.language,e.licensing_notes,e.fingerprint,e.previous_fingerprint,e.retrieved_at from public.automation_reviews r join public.automation_evidence e on e.id=r.evidence_id order by r.updated_at desc limit 100) x),
    'revisions',(select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) from (select * from public.automation_revisions order by created_at desc limit 100) x),
    'history',(select coalesce(jsonb_agg(to_jsonb(x) order by x.id desc),'[]'::jsonb) from (select * from public.automation_history order by id desc limit 100) x),
    'report',jsonb_build_object('cadence','DAILY','alert_preference','IMPORTANT_ONLY','period_start',date_trunc('day',now() at time zone 'UTC') at time zone 'UTC','generated_at',now(),
      'verified_changes',(select count(*) from public.automation_reviews where verified_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC'),
      'drafts_awaiting_review',(select count(*) from public.automation_reviews where status='draft'),
      'failures',(select count(*) from public.automation_jobs where status='failed'),
      'stale_sources',(select count(*) from public.automation_sources where active and (last_success_at is null or last_success_at < now()-make_interval(hours=>stale_after_hours))),
      'fresh_sources',(select count(*) from public.automation_sources where active and last_success_at >= now()-make_interval(hours=>stale_after_hours)),
      'owner_approval',(select count(*) from public.automation_reviews where status in ('draft','approved') or (category='owner_approval' and status not in ('rejected','published'))),
      'actual_cost',0,'currency','INR')
  ) into result;
  return result;
end $$;
revoke all on function public.automation_dashboard() from public,anon;
grant execute on function public.automation_dashboard() to authenticated;
