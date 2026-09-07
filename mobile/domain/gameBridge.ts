export function parseGameMessage(raw: string, sessionId: string, stage: string) {
  if (raw.length > 4096) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || value.bridgeVersion !== 1 || value.sessionId !== sessionId || value.stage !== stage) return null;
    if (value.type === 'GAME_READY' || value.type === 'GAME_EXIT') return { type: value.type as 'GAME_READY' | 'GAME_EXIT' };
    if (value.type !== 'GAME_COMPLETE' || value.completed !== true
      || ![value.score,value.coins].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000)) return null;
    return { type: 'GAME_COMPLETE' as const, score: value.score as number, coins: value.coins as number };
  } catch { return null; }
}
