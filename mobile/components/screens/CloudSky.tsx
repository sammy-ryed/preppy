import { useCallback } from 'react';
import { AppState, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

// Clip individual clouds from the existing 2172 x 724 sprite sheet.
const clouds = [
  { x: 10, y: 35, w: 740, h: 355, size: 220, top: 0.04, offset: 0.18, duration: 54000 },
  { x: 775, y: 120, w: 490, h: 270, size: 150, top: 0.24, offset: 0.84, duration: 71000 },
  { x: 580, y: 440, w: 620, h: 255, size: 260, top: 0.68, offset: 0.48, duration: 43000 },
  { x: 1250, y: 485, w: 365, h: 170, size: 140, top: 0.88, offset: 0.94, duration: 62000 },
];

function Cloud({ cloud }: { cloud: typeof clouds[number] }) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useFocusEffect(useCallback(() => {
    function update(running: boolean) {
      // Reanimated shared values are explicitly mutable animation handles.
      // eslint-disable-next-line react-hooks/immutability
      cancelAnimation(progress);
      if (running && !reducedMotion) {
        // Continue from the current phase when returning from the background.
        progress.value = withRepeat(withTiming(progress.value + 1, { duration: cloud.duration, easing: Easing.linear }), -1, false);
      }
    }
    update(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', state => update(state === 'active'));
    return () => { subscription.remove(); cancelAnimation(progress); };
  }, [cloud.duration, progress, reducedMotion]));
  const motion = useAnimatedStyle(() => ({
    transform: [{ translateX: ((progress.value + cloud.offset) % 1) * (width + cloud.size) - cloud.size }],
  }));
  const scale = cloud.size / cloud.w;
  return <Animated.View style={[s.cloud, { top: height * cloud.top, width: cloud.size, height: cloud.h * scale }, motion]}>
    <Image source={require('../../assets/clouds_multiple.png')} style={{ position: 'absolute', width: 2172 * scale, height: 724 * scale, left: -cloud.x * scale, top: -cloud.y * scale }} />
  </Animated.View>;
}

export function CloudSky() {

  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.sky}>
    {clouds.map((cloud, index) => <Cloud key={index} cloud={cloud} />)}
  </View>;
}
const s = StyleSheet.create({
  sky: { ...StyleSheet.absoluteFill, backgroundColor: '#54BEF2', overflow: 'hidden' },
  cloud: { position: 'absolute', left: 0, overflow: 'hidden', opacity: 0.9 },
});

