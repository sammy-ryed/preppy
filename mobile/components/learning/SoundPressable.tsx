import { forwardRef } from 'react';
import { Pressable, type PressableProps, type View } from 'react-native';
import { playSound } from '../../services/soundEffects';

export const SoundPressable = forwardRef<View, PressableProps & { tapSound?: boolean }>(function SoundPressable(
  { onPress, disabled, tapSound = true, android_disableSound = true, ...props }, ref,
) {
  return <Pressable {...props} ref={ref} disabled={disabled} android_disableSound={android_disableSound} onPress={event => {
    if (disabled || !onPress) return;
    if (tapSound) playSound('tap');
    onPress(event);
  }} />;
});
