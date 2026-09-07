-- One user-state table for this learning slice. Content stays in TypeScript.
begin;

create table public.preppy_user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null check (length(campaign_id) between 1 and 128),
  campaign_version integer not null check (campaign_version > 0),
  revision integer not null default 0 check (revision >= 0),
  xp bigint not null default 0 check (xp between 0 and 9007199254740991),
  skills jsonb not null default '{}'::jsonb check (jsonb_typeof(skills) = 'object'),
  node_results jsonb not null default '{}'::jsonb check (jsonb_typeof(node_results) = 'object'),
  checkpoints jsonb not null default '[]'::jsonb check (jsonb_typeof(checkpoints) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, campaign_id)
);
alter table public.preppy_user_progress enable row level security;
revoke all on public.preppy_user_progress from anon, authenticated;
grant select on public.preppy_user_progress to authenticated;
create policy preppy_read_own_progress on public.preppy_user_progress
  for select to authenticated using ((select auth.uid()) = user_id);

create function public.preppy_initialize_progress(
  p_user_id uuid, p_campaign_id text, p_campaign_version integer, p_skills jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_row public.preppy_user_progress;
  v_skill jsonb;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Unauthorized' using errcode = '42501'; end if;
  if jsonb_typeof(p_skills) is distinct from 'object' then raise exception 'Invalid skills'; end if;
  for v_skill in select value from jsonb_each(p_skills) loop
    if jsonb_typeof(v_skill) is distinct from 'object'
      or jsonb_typeof(v_skill->'mastery') is distinct from 'number'
      or (v_skill->>'mastery')::numeric not in (30, 55, 75)
      or v_skill->'evidenceCount' is distinct from '0'::jsonb then raise exception 'Invalid initial skill'; end if;
  end loop;
  insert into public.preppy_user_progress(user_id, campaign_id, campaign_version, skills)
    values (p_user_id, p_campaign_id, p_campaign_version, p_skills)
    on conflict (user_id, campaign_id) do nothing;
  select * into strict v_row from public.preppy_user_progress where user_id = p_user_id and campaign_id = p_campaign_id;
  if v_row.campaign_version <> p_campaign_version then raise exception 'Campaign version mismatch'; end if;
  return to_jsonb(v_row);
end;
$$;

create function public.preppy_read_progress(p_user_id uuid, p_campaign_id text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_result jsonb;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Unauthorized' using errcode = '42501'; end if;
  select to_jsonb(p) into v_result from public.preppy_user_progress p where p.user_id = p_user_id and p.campaign_id = p_campaign_id;
  return v_result;
end;
$$;

create function public.preppy_commit_node(
  p_user_id uuid, p_campaign_id text, p_campaign_version integer,
  p_expected_revision integer, p_receipt jsonb, p_skills jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_row public.preppy_user_progress;
  v_node text := p_receipt->>'nodeId';
  v_attempt text := p_receipt->>'attemptId';
  v_existing jsonb;
  v_xp bigint;
  v_skill jsonb;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Unauthorized' using errcode = '42501'; end if;
  if jsonb_typeof(p_receipt) is distinct from 'object'
    or v_node is null or length(v_node) not between 1 and 128
    or v_attempt is null or length(v_attempt) not between 1 and 128 then raise exception 'Invalid receipt identity'; end if;
  select * into strict v_row from public.preppy_user_progress
    where user_id = p_user_id and campaign_id = p_campaign_id for update;
  if v_row.campaign_version is distinct from p_campaign_version
    or p_receipt->>'campaignId' is distinct from p_campaign_id
    or (p_receipt->>'campaignVersion')::integer is distinct from p_campaign_version then raise exception 'Campaign version mismatch'; end if;
  if exists(select 1 from jsonb_each(v_row.node_results) r where r.key <> v_node and r.value->>'attemptId' = v_attempt) then raise exception 'Attempt ID already used'; end if;
  v_existing := v_row.node_results->v_node;
  -- Deduplicate BEFORE checking revision: a retry after a lost response returns its receipt.
  if v_existing is not null then
    return jsonb_build_object('status', case when v_existing->>'attemptId' = v_attempt then 'duplicate' else 'replay' end, 'progress', to_jsonb(v_row));
  end if;
  if v_row.revision is distinct from p_expected_revision then return jsonb_build_object('status', 'conflict'); end if;
  if p_receipt->>'persistence' is distinct from 'saved'
    or jsonb_typeof(p_receipt->'xpEarned') is distinct from 'number'
    or jsonb_typeof(p_receipt->'answers') is distinct from 'array'
    or jsonb_typeof(p_receipt->'performance') is distinct from 'object'
    or jsonb_typeof(p_skills) is distinct from 'object' then raise exception 'Invalid completion payload'; end if;
  if jsonb_array_length(p_receipt->'answers') = 0 then raise exception 'Missing answers'; end if;
  if (p_receipt->>'xpEarned')::numeric <> trunc((p_receipt->>'xpEarned')::numeric) then raise exception 'Invalid XP'; end if;
  v_xp := (p_receipt->>'xpEarned')::bigint;
  if v_xp < 0 or v_xp > 9007199254740991 - v_row.xp then raise exception 'Invalid XP'; end if;
  for v_skill in select value from jsonb_each(p_skills) loop
    if jsonb_typeof(v_skill) is distinct from 'object'
      or jsonb_typeof(v_skill->'mastery') is distinct from 'number'
      or jsonb_typeof(v_skill->'evidenceCount') is distinct from 'number'
      or (v_skill->>'mastery')::numeric not between 0 and 100
      or (v_skill->>'mastery')::numeric <> trunc((v_skill->>'mastery')::numeric)
      or (v_skill->>'evidenceCount')::numeric not between 0 and 9007199254740991
      or (v_skill->>'evidenceCount')::numeric <> trunc((v_skill->>'evidenceCount')::numeric)
      then raise exception 'Invalid skill estimate'; end if;
  end loop;
  -- Scores remain client-evaluated for the hackathon. These functions enforce
  -- ownership, atomicity, numeric bounds, and idempotency, not exam anti-cheat.
  p_receipt := jsonb_set(p_receipt, '{completedAt}', to_jsonb(now()));
  update public.preppy_user_progress set
    node_results = node_results || jsonb_build_object(v_node, p_receipt),
    skills = p_skills, xp = xp + v_xp, revision = revision + 1, updated_at = now()
    where user_id = p_user_id and campaign_id = p_campaign_id returning * into v_row;
  return jsonb_build_object('status', 'saved', 'progress', to_jsonb(v_row));
end;
$$;

revoke all on function public.preppy_initialize_progress(uuid, text, integer, jsonb) from public, anon;
revoke all on function public.preppy_read_progress(uuid, text) from public, anon;
revoke all on function public.preppy_commit_node(uuid, text, integer, integer, jsonb, jsonb) from public, anon;
grant execute on function public.preppy_initialize_progress(uuid, text, integer, jsonb) to authenticated;
grant execute on function public.preppy_read_progress(uuid, text) to authenticated;
grant execute on function public.preppy_commit_node(uuid, text, integer, integer, jsonb, jsonb) to authenticated;
commit;
