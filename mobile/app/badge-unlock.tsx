import { SoundPressable as Pressable } from '../components/learning/SoundPressable';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BackHandler, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeArt } from '../components/learning/BadgeArt';
import { useBadgeNotifications } from '../components/learning/BadgeUnlocks';
import { useBadges } from '../hooks/useBadges';
import { playSound } from '../services/soundEffects';

export default function BadgeUnlockScreen() {
  const { badgeId } = useLocalSearchParams<{ badgeId?: string }>();
  const { badges } = useBadges();
  const { pending, acknowledge } = useBadgeNotifications();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const closing = useRef(false);
  const badge = badgeId ? badges.find(item => item.id === badgeId && item.earned) : pending[0];
  const remaining = badgeId ? 0 : Math.max(0, pending.length - 1);
  const [celebrationVisit] = useState(() => `${Date.now()}:${Math.random()}`);
  useFocusEffect(useCallback(() => {
    if (badge) playSound('badge', `${celebrationVisit}:${badge.notificationId}`);
  }, [badge, celebrationVisit]));
  const leave = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (router.canGoBack()) router.back(); else router.replace('/map');
  }, [router]);
  // Invalid/deep-linked or exhausted queues must not leave an invisible blocking route.
  useEffect(() => { if (!badge) leave(); }, [badge, leave]);
  const dismiss = useCallback(() => {
    if (closing.current || !badge) return;
    if (!badgeId) void acknowledge(badge.id);
    if (!remaining) leave();
  }, [acknowledge, badge, badgeId, leave, remaining]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { dismiss(); return true; });
    return () => subscription.remove();
  }, [dismiss]));
  if (!badge) return <View style={s.scrim} />;
  const artWidth = Math.max(100, Math.min(width - 72, 320, (height - insets.top - insets.bottom - 210) / 1.501));
  return <View accessibilityViewIsModal style={[s.scrim, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
    <View style={s.panel}>
      <ScrollView bounces={false} style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>{badgeId ? 'YOUR ADVENTURE KEEPSAKE' : 'NEW BADGE UNLOCKED'}</Text>
        <Text accessibilityRole="header" style={s.title}>{badge.title}</Text>
        <BadgeArt id={badge.id} width={artWidth} />
      </ScrollView>
      <View style={s.footer}>
        <Pressable accessibilityRole="button" onPress={dismiss} style={({ pressed }) => [s.button, pressed && { opacity: 0.7 }]}>
          <Text style={s.buttonText}>{remaining ? `Next badge (${remaining} more) →` : 'Awesome! Keep going →'}</Text>
        </Pressable>
      </View>
    </View>
  </View>;
}
const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: '#192437C9', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  panel: { width: '100%', maxWidth: 390, maxHeight: '100%', borderRadius: 28, borderWidth: 2, borderColor: '#643751', backgroundColor: '#FFF9EF', overflow: 'hidden' },
  scroll: { flexGrow: 0, flexShrink: 1 },
  content: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  eyebrow: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 10, color: '#9D3865', letterSpacing: 1.2 },
  title: { fontFamily: 'BalooTamma2_800ExtraBold', fontSize: 26, lineHeight: 32, textAlign: 'center', color: '#413547' },
  footer: { padding: 16 },
  button: { minHeight: 52, borderRadius: 18, backgroundColor: '#FFB4D2', borderWidth: 1.5, borderColor: '#A44670', justifyContent: 'center', alignItems: 'center', padding: 12 },
  buttonText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: '#60233F' },
});
