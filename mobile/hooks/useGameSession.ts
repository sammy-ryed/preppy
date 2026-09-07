import { useRef, useState } from 'react';
import { useCampaignProgress } from './useCampaignProgress';
import { useLearningApplication } from '../providers/LearningProvider';
import { getSupabase } from '../lib/supabase';
import { parseGameMessage } from '../domain/gameBridge';
import { decodeProgress } from '../repositories/supabaseProgressRepository';

export function useGameSession(checkpointId: string) {
  const progress = useCampaignProgress();
  const { application } = useLearningApplication();
  const checkpoint = progress.checkpoints.find(item => item.id === checkpointId);
  const [sessionId] = useState(() => `game-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [status, setStatus] = useState<'idle'|'active'|'saving'|'completed'|'skipped'|'cancelled'>('idle');
  const [error,setError] = useState<string|null>(null);
  const busy = useRef(false);
  const pending = useRef<{action: 'start'|'complete'|'cancel'|'skip';score:number;coins:number}|null>(null);
  const [xp,setXp] = useState(0);
  const [reloadKey,setReloadKey] = useState(0);
  const gameUrl = process.env.EXPO_PUBLIC_GAME_URL?.trim();
  let uri: string|null = null;
  if (gameUrl && checkpoint) {
    try {
      const url = new URL(gameUrl);
      if (url.protocol === 'https:' && !url.username && !url.password) {
        url.searchParams.set('bridgeVersion','1'); url.searchParams.set('sessionId',sessionId); url.searchParams.set('stage',checkpoint.stage);
        uri=url.toString();
      }
    } catch { /* Configuration is reported on the screen. */ }
  }
  async function action(kind: 'start'|'complete'|'cancel'|'skip',score=0,coins=0) {
    if (busy.current || !checkpoint || checkpoint.status === 'locked' || !progress.campaign) return;
    busy.current=true; pending.current={action:kind,score,coins};setError(null);setStatus('saving');
    try {
      const {data,error:failure}=await getSupabase().rpc('preppy_game_action',{
        p_campaign_id:progress.campaign.id,p_checkpoint_id:checkpoint.id,p_session_id:sessionId,p_action:kind,p_score:score,p_coins:coins,
      });
      if(failure) throw new Error(failure.code === 'PGRST202' ? 'Apply the game-session migration in Supabase before continuing.' : failure.message);
      decodeProgress(data.progress);
      if(!['active','completed','skipped','cancelled'].includes(data.status)) throw new Error('Invalid game response');
      setStatus(data.status);setXp(data.xpAwardedNow);pending.current=null;
      await application.refresh();
    } catch(e) { setError(e instanceof Error?e.message:'Game request failed'); }
    finally { busy.current=false; }
  }
  function receive(raw:string) {
    if(status!=='active' || busy.current || !checkpoint) return;
    const message=parseGameMessage(raw,sessionId,checkpoint.stage);
    if(message?.type==='GAME_COMPLETE') void action('complete',message.score,message.coins);
    if(message?.type==='GAME_EXIT') void action('cancel');
  }
  function retry() {
    if (pending.current) return action(pending.current.action,pending.current.score,pending.current.coins);
    setError(null);
    if (status === 'active') { setReloadKey(value=>value+1); return Promise.resolve(); }
    return application.refresh();
  }
  return {checkpoint,loading:progress.loading,error:error??progress.error,status,xp,uri,reloadKey,
    launch:()=>uri?action('start'):Promise.resolve(),skip:()=>checkpoint?.canSkip?action('skip'):Promise.resolve(),
    cancel:()=>action('cancel'),receive,retry,
    loadError:(message?:string)=>setError(message || 'The game could not load. Check its URL and connection, then retry or exit.'),
  };
}
