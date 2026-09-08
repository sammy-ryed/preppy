import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useBadges } from '../../hooks/useBadges';
import { BadgeArt } from './BadgeArt';

export function BadgeUnlocks() {
  const { badges, storageKey, status } = useBadges();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const [seen, setSeen] = useState<{ key: string; ids: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  useEffect(() => {
    if (!storageKey) return;
    let cancelled = false;
    async function restore() {
      let ids: string[] = [];
      try {
        const raw = await AsyncStorage.getItem(storageKey!);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === 'string');
      } catch { /* An unavailable notification cache must not hide earned badges. */ }
      if (!cancelled) setSeen({ key: storageKey!, ids });
    }
    void restore();
    return () => { cancelled = true; };
  }, [storageKey]);
  const pending = seen?.key === storageKey ? badges.filter(badge => badge.earned && !seen.ids.includes(badge.id)) : [];
  const badge = pending[0];
  // Let the full-screen game finish and return to the map before celebrating.
  const visible = Boolean(badge && status === 'ready' && !pathname.startsWith('/game/'));
  async function dismiss() {
    if (!badge || !seen || busy.current) return;
    busy.current = true; setSaving(true);
    const next = { key: seen.key, ids: [...seen.ids, badge.id] };
    try { await AsyncStorage.setItem(next.key, JSON.stringify(next.ids)); }
    catch { /* Still dismiss in memory if device storage is temporarily unavailable. */ }
    finally { setSeen(next); setSaving(false); busy.current = false; }
  }
  return <Modal visible={visible} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => void dismiss()} statusBarTranslucent>
    <View style={s.scrim}>
      {badge && <ScrollView style={{ maxHeight: height * 0.85, width: Math.min(width - 40, 360) }} contentContainerStyle={s.card} bounces={false}>
        <Text style={s.eyebrow}>✦ NEW BADGE UNLOCKED ✦</Text>
        <BadgeArt id={badge.id} width={Math.min(width - 100, 245)} />
        <Text accessibilityRole="header" style={s.title}>{badge.nickname}</Text>
        <Text style={s.name}>{badge.title}</Text>
        <Text style={s.body}>A new keepsake for your adventure.{ '\n' }Find it anytime in your badge collection.</Text>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void dismiss()} style={({ pressed }) => [s.button, (pressed || saving) && { opacity: 0.65 }]}>
          <Text style={s.buttonText}>{pending.length > 1 ? 'Awesome! Next badge →' : 'Awesome! Keep going →'}</Text>
        </Pressable>
        {pending.length > 1 && <Text style={s.body}>{pending.length - 1} more to celebrate</Text>}
      </ScrollView>}
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: '#192437B8', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { alignItems: 'center', padding: 24, gap: 14, backgroundColor: '#FFF9EF', borderRadius: 28, borderWidth: 2, borderColor: '#643751' },
  eyebrow: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 11, color: '#9D3865', letterSpacing: 1 },
  title: { fontFamily: 'BalooTamma2_800ExtraBold', fontSize: 30, lineHeight: 36, textAlign: 'center', color: '#413547' },
  name: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#643751' },
  body: { fontFamily: 'InstrumentSans_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', color: '#746470' },
  button: { width: '100%', minHeight: 52, borderRadius: 18, backgroundColor: '#FFB4D2', borderWidth: 1.5, borderColor: '#A44670', justifyContent: 'center', alignItems: 'center', padding: 12 },
  buttonText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: '#60233F' },
});
