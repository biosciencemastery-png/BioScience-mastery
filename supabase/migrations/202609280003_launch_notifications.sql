begin;
alter table public.course_interest_subscriptions add column confirmation_expires_at timestamptz;
alter table public.course_interest_subscriptions add column last_requested_at timestamptz;
alter table public.course_interest_subscriptions add column launch_notified_at timestamptz;
create unique index subscriptions_confirmation_hash on public.course_interest_subscriptions(confirmation_token_hash) where confirmation_token_hash is not null;
create unique index subscriptions_unsubscribe_hash on public.course_interest_subscriptions(unsubscribe_token_hash) where unsubscribe_token_hash is not null;
-- Keep older delivered unsubscribe links valid when a later message gets a new token.
create table public.notification_unsubscribe_tokens (
 token_hash text primary key check(token_hash ~ '^[a-f0-9]{64}$'),
 subscription_id uuid not null references public.course_interest_subscriptions(id) on delete cascade
);
alter table public.notification_unsubscribe_tokens enable row level security;
revoke all on public.notification_unsubscribe_tokens from public,anon,authenticated;
grant all on public.notification_unsubscribe_tokens to service_role;
insert into public.notification_unsubscribe_tokens(token_hash,subscription_id)
select unsubscribe_token_hash,id from public.course_interest_subscriptions where unsubscribe_token_hash ~ '^[a-f0-9]{64}$';
create table public.notification_rate_limits (
 bucket text primary key, window_start timestamptz not null, requests integer not null
);
create table public.notification_outbox (
 id uuid primary key default gen_random_uuid(),
 subscription_id uuid not null references public.course_interest_subscriptions(id) on delete cascade,
 kind text not null check(kind in ('confirmation','launch')),
 encrypted_payload text not null,
 status text not null default 'queued' check(status in ('queued','processing','sent','failed','cancelled')),
 attempts integer not null default 0, available_at timestamptz not null default now(),
 lease_id uuid, lease_until timestamptz, created_at timestamptz not null default now(), sent_at timestamptz
);
create unique index one_launch_job on public.notification_outbox(subscription_id) where kind='launch';
create index notification_queue on public.notification_outbox(status,available_at);
alter table public.notification_rate_limits enable row level security;
alter table public.notification_outbox enable row level security;
revoke all on public.notification_rate_limits,public.notification_outbox from public,anon,authenticated;
grant all on public.notification_rate_limits,public.notification_outbox,public.course_interest_subscriptions to service_role;
grant select on public.courses,public.examinations to service_role;

create function private.notification_rate(bucket_key text, max_requests integer) returns boolean
language plpgsql set search_path='' as $$
declare count_now integer;
begin
 insert into public.notification_rate_limits(bucket,window_start,requests) values(bucket_key,now(),1)
 on conflict(bucket) do update set
 requests=case when notification_rate_limits.window_start < now()-interval '1 hour' then 1 else notification_rate_limits.requests+1 end,
 window_start=case when notification_rate_limits.window_start < now()-interval '1 hour' then now() else notification_rate_limits.window_start end
 returning requests into count_now;
 return count_now<=max_requests;
end; $$;

create function public.request_launch_notification(p_course uuid,p_email text,p_locale text,p_confirm_hash text,p_unsubscribe_hash text,p_payload text,p_email_bucket text,p_source_bucket text) returns boolean
language plpgsql security definer set search_path='' as $$
declare sid uuid; existing public.course_interest_subscriptions; allowed boolean;
begin
 if p_locale not in ('en','hi') or p_email<>lower(btrim(p_email)) or length(p_email)>254 or length(p_email)<3
 or p_confirm_hash !~ '^[a-f0-9]{64}$' or p_unsubscribe_hash !~ '^[a-f0-9]{64}$'
 or length(p_payload)>20000 or p_email_bucket !~ '^[a-f0-9]{64}$' or p_source_bucket !~ '^[a-f0-9]{64}$' then return false; end if;
 -- Limits survive rejection because this function returns normally rather than rolling back.
 allowed:=private.notification_rate('email:'||p_email_bucket,3);
 allowed:=private.notification_rate('source:'||p_source_bucket,10) and allowed;
 allowed:=private.notification_rate('global',500) and allowed;
 if not allowed then return false; end if;
 if not exists(select 1 from public.courses c join public.examinations e on e.id=c.examination_id
   where c.id=p_course and c.is_public and e.is_public and c.launch_status in ('coming_soon','in_preparation')) then return false; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_course::text||p_email,1));
 select * into existing from public.course_interest_subscriptions where course_id=p_course and email_normalized=p_email for update;
 if existing.status='confirmed' or existing.last_requested_at>now()-interval '15 minutes' then return false; end if;
 insert into public.course_interest_subscriptions(course_id,email_normalized,locale,consent_version,confirmation_token_hash,unsubscribe_token_hash,confirmation_expires_at,last_requested_at)
 values(p_course,p_email,p_locale,'launch-v1',p_confirm_hash,p_unsubscribe_hash,now()+interval '24 hours',now())
 on conflict(course_id,email_normalized) do update set status='pending',locale=excluded.locale,consent_version='launch-v1',consent_recorded_at=now(),
 confirmation_token_hash=p_confirm_hash,unsubscribe_token_hash=p_unsubscribe_hash,confirmation_expires_at=now()+interval '24 hours',last_requested_at=now(),confirmed_at=null,unsubscribed_at=null
 returning id into sid;
 insert into public.notification_unsubscribe_tokens values(p_unsubscribe_hash,sid);
 update public.notification_outbox set status='cancelled' where subscription_id=sid and status in ('queued','processing');
 insert into public.notification_outbox(subscription_id,kind,encrypted_payload) values(sid,'confirmation',p_payload);
 return true;
end; $$;

create function public.confirm_launch_notification(p_hash text) returns boolean
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 update public.course_interest_subscriptions set status='confirmed',confirmed_at=now(),confirmation_token_hash=null
 where confirmation_token_hash=p_hash and status='pending' and confirmation_expires_at>now() returning id into sid;
 return sid is not null;
end; $$;
create function public.unsubscribe_launch_notification(p_hash text) returns boolean
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 update public.course_interest_subscriptions set status='unsubscribed',unsubscribed_at=coalesce(unsubscribed_at,now()),confirmation_token_hash=null
 where id=(select subscription_id from public.notification_unsubscribe_tokens where token_hash=p_hash) returning id into sid;
 update public.notification_outbox set status='cancelled' where subscription_id=sid and status in ('queued','processing');
 return sid is not null;
end; $$;
create function public.queue_course_launch(p_subscription uuid,p_unsubscribe_hash text,p_payload text) returns boolean
language plpgsql security definer set search_path='' as $$
declare target public.course_interest_subscriptions;
begin
 select * into target from public.course_interest_subscriptions where id=p_subscription for update;
 if target.id is null or target.status<>'confirmed' or target.launch_notified_at is not null or
 not exists(select 1 from public.courses c join public.examinations e on e.id=c.examination_id where c.id=target.course_id and c.launch_status='published' and c.is_public and e.is_public) then return false; end if;
 if exists(select 1 from public.notification_outbox where subscription_id=p_subscription and kind='launch') then return false; end if;
 if p_unsubscribe_hash !~ '^[a-f0-9]{64}$' or length(p_payload)>20000 then return false; end if;
 update public.course_interest_subscriptions set unsubscribe_token_hash=p_unsubscribe_hash where id=p_subscription;
 insert into public.notification_unsubscribe_tokens values(p_unsubscribe_hash,p_subscription);
 insert into public.notification_outbox(subscription_id,kind,encrypted_payload) values(p_subscription,'launch',p_payload);
 return true;
end; $$;
create function public.claim_notification_job() returns setof public.notification_outbox
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 delete from public.notification_rate_limits where window_start<now()-interval '2 hours';
 update public.notification_outbox set encrypted_payload='' where status in ('sent','cancelled','failed') and created_at<now()-interval '24 hours' and encrypted_payload<>'';
 update public.notification_outbox set status='failed' where status in ('queued','processing') and created_at<now()-interval '23 hours';
 select o.id into target from public.notification_outbox o join public.course_interest_subscriptions s on s.id=o.subscription_id
 where ((o.status='queued' and o.available_at<=now()) or (o.status='processing' and o.lease_until<now())) and o.attempts<5
 and ((o.kind='confirmation' and s.status='pending' and s.confirmation_expires_at>now()) or (o.kind='launch' and s.status='confirmed' and exists(select 1 from public.courses c join public.examinations e on e.id=c.examination_id where c.id=s.course_id and c.launch_status='published' and c.is_public and e.is_public)))
 order by o.created_at for update of o skip locked limit 1;
 return query update public.notification_outbox set status='processing',attempts=attempts+1,lease_id=gen_random_uuid(),lease_until=now()+interval '5 minutes' where id=target returning *;
end; $$;
create function public.finish_notification_job(p_job uuid,p_lease uuid,p_success boolean) returns void
language plpgsql security definer set search_path='' as $$
declare result public.notification_outbox;
begin
 update public.notification_outbox set status=case when p_success then 'sent' when attempts>=5 then 'failed' else 'queued' end,
 sent_at=case when p_success then now() else null end,available_at=now()+interval '5 minutes',lease_until=null,
 encrypted_payload=case when p_success then '' else encrypted_payload end
 where id=p_job and lease_id=p_lease and status='processing' returning * into result;
 if p_success and result.kind='launch' then update public.course_interest_subscriptions set launch_notified_at=now() where id=result.subscription_id; end if;
end; $$;
create function public.launch_notification_candidates() returns table(id uuid,email_normalized text,locale text,title text,slug text)
language sql security definer set search_path='' as $$
 select s.id,s.email_normalized,s.locale,c.title,c.slug from public.course_interest_subscriptions s
 join public.courses c on c.id=s.course_id join public.examinations e on e.id=c.examination_id
 where s.status='confirmed' and s.launch_notified_at is null and c.launch_status='published' and c.is_public and e.is_public
 and not exists(select 1 from public.notification_outbox o where o.subscription_id=s.id and o.kind='launch')
 order by s.confirmed_at,s.id limit 100;
$$;
revoke all on function public.launch_notification_candidates() from public,anon,authenticated;
grant execute on function public.launch_notification_candidates() to service_role;
revoke all on function private.notification_rate(text,integer) from public,anon,authenticated;
revoke all on function public.request_launch_notification(uuid,text,text,text,text,text,text,text),public.confirm_launch_notification(text),public.unsubscribe_launch_notification(text),public.queue_course_launch(uuid,text,text),public.claim_notification_job(),public.finish_notification_job(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.request_launch_notification(uuid,text,text,text,text,text,text,text),public.confirm_launch_notification(text),public.unsubscribe_launch_notification(text),public.queue_course_launch(uuid,text,text),public.claim_notification_job(),public.finish_notification_job(uuid,uuid,boolean) to service_role;
commit;
