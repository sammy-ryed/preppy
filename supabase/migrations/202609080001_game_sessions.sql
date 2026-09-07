begin;
create table public.preppy_game_sessions (
  session_id text primary key check (length(session_id) between 1 and 128),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id text not null,
  checkpoint_id text not null,
  status text not null check (status in ('active','cancelled','completed','skipped')),
  score integer not null default 0,
  coins integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id,campaign_id) references public.preppy_user_progress(user_id,campaign_id) on delete cascade
);
alter table public.preppy_game_sessions enable row level security;
revoke all on public.preppy_game_sessions from anon,authenticated;
grant select on public.preppy_game_sessions to authenticated;
create policy preppy_game_own on public.preppy_game_sessions for select to authenticated using ((select auth.uid())=user_id);

create function public.preppy_game_action(p_campaign_id text,p_checkpoint_id text,p_session_id text,p_action text,p_score integer default 0,p_coins integer default 0)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  u uuid := auth.uid();
  p public.preppy_user_progress;
  s public.preppy_game_sessions;
  resolved text;
  required_node text;
  reward integer := 0;
begin
  if u is null then raise exception 'Unauthorized' using errcode='42501'; end if;
  if p_campaign_id is distinct from 'placement-foundations-v1' or p_action is null or p_action not in ('start','complete','cancel','skip')
    or p_session_id is null or length(p_session_id) not between 1 and 128 then raise exception 'Invalid game request'; end if;
  required_node := case p_checkpoint_id
    when 'placement-foundations-v1:break1' then 'placement-foundations-v1:node-05'
    when 'placement-foundations-v1:break2' then 'placement-foundations-v1:node-10'
    when 'placement-foundations-v1:finalBoss' then 'placement-foundations-v1:node-15' else null end;
  if required_node is null then raise exception 'Unknown checkpoint'; end if;
  if p_score is null or p_coins is null or p_score not between 0 and 1000000 or p_coins not between 0 and 1000000 then raise exception 'Invalid game result'; end if;
  select * into p from public.preppy_user_progress where user_id=u and campaign_id=p_campaign_id for update;
  if not found or p.campaign_version<>1 or not (p.node_results ? required_node) then raise exception 'Checkpoint locked'; end if;
  select * into s from public.preppy_game_sessions where session_id=p_session_id;
  if found and (s.user_id<>u or s.campaign_id<>p_campaign_id or s.checkpoint_id<>p_checkpoint_id) then raise exception 'Session identity mismatch'; end if;
  select item->>'status' into resolved from jsonb_array_elements(p.checkpoints) item where item->>'checkpointId'=p_checkpoint_id;
  if resolved in ('completed','skipped') then
    return jsonb_build_object('status',resolved,'xpAwardedNow',0,'progress',to_jsonb(p));
  end if;
  if p_action='start' then
    if s.session_id is not null and s.status<>'active' then raise exception 'Session closed'; end if;
    update public.preppy_game_sessions set status='cancelled',updated_at=now()
      where user_id=u and campaign_id=p_campaign_id and checkpoint_id=p_checkpoint_id and status='active' and session_id<>p_session_id;
    insert into public.preppy_game_sessions(session_id,user_id,campaign_id,checkpoint_id,status)
      values(p_session_id,u,p_campaign_id,p_checkpoint_id,'active') on conflict(session_id) do nothing;
    return jsonb_build_object('status','active','xpAwardedNow',0,'progress',to_jsonb(p));
  end if;
  if p_action='cancel' then
    if s.status='active' then update public.preppy_game_sessions set status='cancelled',updated_at=now() where session_id=p_session_id; end if;
    return jsonb_build_object('status','cancelled','xpAwardedNow',0,'progress',to_jsonb(p));
  end if;
  if p_action='complete' then
    if s.session_id is null or s.status<>'active' then raise exception 'No active session'; end if;
    resolved := 'completed'; reward := case when required_node like '%15' then 100 else 50 end;
    update public.preppy_game_sessions set status='completed',score=p_score,coins=p_coins,updated_at=now() where session_id=p_session_id;
  else
    resolved := 'skipped';
    if s.session_id is not null and s.status<>'active' then raise exception 'Session closed'; end if;
    insert into public.preppy_game_sessions(session_id,user_id,campaign_id,checkpoint_id,status)
      values(p_session_id,u,p_campaign_id,p_checkpoint_id,'skipped')
      on conflict(session_id) do update set status='skipped',updated_at=now();
  end if;
  update public.preppy_game_sessions set status='cancelled',updated_at=now()
    where user_id=u and campaign_id=p_campaign_id and checkpoint_id=p_checkpoint_id and status='active';
  update public.preppy_user_progress set
    checkpoints=coalesce((select jsonb_agg(item) from jsonb_array_elements(checkpoints) item where item->>'checkpointId'<>p_checkpoint_id),'[]'::jsonb)
      ||jsonb_build_array(jsonb_build_object('checkpointId',p_checkpoint_id,'status',resolved)),
    xp=xp+reward,revision=revision+1,updated_at=now()
    where user_id=u and campaign_id=p_campaign_id returning * into p;
  return jsonb_build_object('status',resolved,'xpAwardedNow',reward,'progress',to_jsonb(p));
end;
$$;
revoke all on function public.preppy_game_action(text,text,text,text,integer,integer) from public,anon;
grant execute on function public.preppy_game_action(text,text,text,text,integer,integer) to authenticated;
commit;
