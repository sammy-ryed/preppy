import { useEffect } from 'react';
import { startSoundEffects } from '../../services/soundEffects';

export function SoundEffects() {
  useEffect(startSoundEffects, []);
  return null;
}
