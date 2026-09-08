import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { playSound } from '../../services/soundEffects';

type Point = { x: number; y: number };
const played = new Set<string>();
export function BimboJourney({ from, to, transitionId }: { from?: Point; to: Point; transitionId?: string }) {
  const [travel] = useState(() => new Animated.Value(from ? 0 : 1));
  const start = from ?? to;
  useEffect(() => {
    let disposed = false;
    let animation: Animated.CompositeAnimation | undefined;
    let soundTimer: ReturnType<typeof setTimeout> | undefined;
    travel.setValue(from ? 0 : 1);
    void AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (disposed) return;
      if (!from || !transitionId || played.has(transitionId)) { travel.setValue(1); return; }
      played.add(transitionId);
      if (played.size > 100) played.delete(played.values().next().value!);
      if (reduce) { travel.setValue(1); playSound('levelUp', transitionId); return; }
      animation = Animated.sequence([
        Animated.delay(350),
        Animated.timing(travel, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      ]);
      animation.start();
      soundTimer = setTimeout(() => { if (!disposed) playSound('levelUp', transitionId); }, 350);
    }).catch(() => travel.setValue(1));
    return () => { disposed = true; animation?.stop(); if (soundTimer) clearTimeout(soundTimer); };
  }, [from?.x, from?.y, to.x, to.y, transitionId, travel]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View pointerEvents="none" accessibilityLabel="Bimbo: play this node next" style={[s.marker, {
    transform: [
      { translateX: travel.interpolate({ inputRange: [0, 1], outputRange: [start.x, to.x] }) },
      { translateY: travel.interpolate({ inputRange: [0, 0.5, 1], outputRange: [start.y, (start.y + to.y) / 2 - 16, to.y] }) },
    ],
  }]}>
    <View style={s.crop}><Image source={require('../../assets/bmo1.png')} style={s.bimbo} resizeMode="contain" /></View>
    <Text style={s.arrow}>▼</Text>
  </Animated.View>;
}
const s = StyleSheet.create({
  marker: { position: 'absolute', top: 0, left: 0, alignItems: 'center', zIndex: 10 },
  crop: { width: 40, height: 35, overflow: 'hidden' },
  bimbo: { position: 'absolute', width: 62, height: 68, left: -11, top: -17 },
  arrow: { color: '#177D79', fontSize: 13, lineHeight: 14 },
});
