begin;
-- Idempotent, own-account requests. No client-provided user id or status.
create function public.request_account_deletion() returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); request_id uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor::text, 0));
  select id into request_id from public.account_deletion_requests
    where user_id=actor and status in ('requested','processing');
  if request_id is null then
    insert into public.account_deletion_requests(user_id) values(actor) returning id into request_id;
  end if;
  return request_id;
end;
$$;
revoke all on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
-- Existing row/column restrictions remain; this RPC adds no delete-account capability.
commit;
