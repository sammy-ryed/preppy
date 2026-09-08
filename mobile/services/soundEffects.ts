import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { AppState } from 'react-native';

const sources = {
  tap: require('../assets/tap-sound.mp3'),
  wrong: require('../assets/wrong-answer-sound-effect.mp3'),
  correct: require('../assets/correct-sound.mp3'),
  levelUp: require('../assets/level-up-sound.mp3'),
  badge: require('../assets/badge-sound.mp3'),
};
export type SoundEffect = keyof typeof sources;
type Player = ReturnType<typeof createAudioPlayer>;
let players: Partial<Record<SoundEffect, Player>> = {};
let active = true;
let generation = 0;
const heard = new Set<string>();
const pendingEvents = new Map<SoundEffect, string>();
const requests = new Map<SoundEffect, number>();
const waiting = new Map<SoundEffect, { remove(): void }>();

export function startSoundEffects() {
  active = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
  void setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  for (const sound of Object.keys(sources) as SoundEffect[]) {
    try {
      const player = createAudioPlayer(sources[sound], { downloadFirst: true, keepAudioSessionActive: false });
      player.volume = sound === 'tap' ? 0.8 : 0.7;
      players[sound] = player;
    } catch { /* Audio must never block navigation or learning. */ }
  }
  const subscription = AppState.addEventListener('change', state => {
    active = state === 'active';
    if (!active) {
      generation++;
      waiting.forEach(listener => listener.remove()); waiting.clear();
      pendingEvents.clear();
      Object.values(players).forEach(player => { try { player.pause(); } catch {} });
    }
  });
  return () => {
    generation++;
    subscription.remove();
    waiting.forEach(listener => listener.remove()); waiting.clear();
    pendingEvents.clear();
    Object.values(players).forEach(player => { try { player.remove(); } catch {} });
    players = {};
  };
}

export function playSound(sound: SoundEffect, eventId?: string) {
  const player = players[sound];
  const eventKey = eventId ? `${sound}:${eventId}` : null;
  if (!active || !player || (eventKey && (heard.has(eventKey) || pendingEvents.get(sound) === eventKey))) return;
  pendingEvents.delete(sound);
  if (eventKey) pendingEvents.set(sound, eventKey);
  const request = (requests.get(sound) ?? 0) + 1;
  requests.set(sound, request);
  const currentGeneration = generation;
  waiting.get(sound)?.remove(); waiting.delete(sound);
  const valid = () => active && currentGeneration === generation && requests.get(sound) === request && players[sound] === player;
  const finish = () => { if (valid()) pendingEvents.delete(sound); };
  const beginPlayback = () => {
    if (!valid()) return;
    try {
      player.play();
      // Only acknowledge an event after issuing playback successfully, not while
      // waiting for a load/seek that might fail or be interrupted.
      if (eventKey) {
        heard.add(eventKey);
        if (heard.size > 500) heard.delete(heard.values().next().value!);
      }
    } catch { /* A failed start remains retryable. */ }
    finally { finish(); }
  };
  const play = () => {
    if (!valid()) return;
    try {
      // Feedback replaces a tap rather than playing both effects over each other.
      if (sound !== 'tap') players.tap?.pause();
      if (player.currentTime === 0 && !player.playing) {
        // A preloaded first tap can start in the press handler, without an async
        // seek round trip (also preserves the browser's user activation).
        beginPlayback();
      } else {
        player.pause();
        void player.seekTo(0).then(beginPlayback).catch(finish);
      }
    } catch { finish(); }
  };
  // On Android, the isLoaded property only checks STATE_READY, whereas
  // currentStatus.isLoaded also includes STATE_ENDED. An ended clip needs a
  // rewind now, not a listener waiting for a new load that will never occur.
  if (player.currentStatus.isLoaded || player.isLoaded) play();
  else {
    const listener = player.addListener('playbackStatusUpdate', status => {
      if (!status.isLoaded) return;
      listener.remove(); waiting.delete(sound); play();
    });
    waiting.set(sound, listener);
  }
}
