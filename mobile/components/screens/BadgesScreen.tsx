import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBadges } from '../../hooks/useBadges';
import { BadgeArt } from '../learning/BadgeArt';
import { JourneyHeader } from '../learning/JourneyHeader';

export default function BadgesScreen() {
  const { badges, status, error, retry } = useBadges();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const earned = badges.filter(badge => badge.earned).length;
  return <View style={s.screen}>
    <JourneyHeader compact />
    <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 24 }]}>
      <Pressable accessibilityRole="button" style={s.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/map')}><Text style={s.backText}>← Back to adventure</Text></Pressable>
      <Text style={s.eyebrow}>YOUR LITTLE WALL OF GLORY</Text>
      <Text accessibilityRole="header" style={s.title}>Adventure keepsakes</Text>
      <Text style={s.subtitle}>{earned} of 5 collected. Every badge tells a story.</Text>
      {(status === 'loading' || status === 'idle') && <ActivityIndicator color="#9D3865" />}
      {error && <View style={s.card}><Text accessibilityRole="alert" style={s.hint}>{error}</Text><Pressable accessibilityRole="button" style={s.back} onPress={() => void retry()}><Text style={s.backText}>Try again</Text></Pressable></View>}
      {badges.map(badge => <View key={badge.id} style={[s.card, !badge.earned && s.lockedCard]}>
        <View style={s.art}><BadgeArt id={badge.id} width={Math.min(width - 100, 260)} locked={!badge.earned} />
          {!badge.earned && <View style={s.lock}><Text style={s.lockText}>🔒 LOCKED</Text></View>}
        </View>
        <Text style={[s.state, badge.earned && s.earned]}>{badge.earned ? '✓ COLLECTED' : 'STILL TO DISCOVER'}</Text>
        <Text accessibilityRole="header" style={s.badgeTitle}>{badge.title}</Text>
        <Text style={s.nickname}>{badge.nickname}</Text>
        <Text style={s.hint}>{badge.earned ? 'You earned this keepsake. Nice adventuring!' : badge.hint}</Text>
      </View>)}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF9EF' },
  content: { padding: 22, gap: 14, width: '100%', maxWidth: 540, alignSelf: 'center' },
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#FFE0ED' },
  backText: { fontFamily: 'InstrumentSans_600SemiBold', color: '#60233F', fontSize: 13 },
  eyebrow: { fontFamily: 'InstrumentSans_600SemiBold', color: '#9D3865', letterSpacing: 1.2, fontSize: 10, marginTop: 10 },
  title: { fontFamily: 'BalooTamma2_800ExtraBold', color: '#413547', fontSize: 32, lineHeight: 38 },
  subtitle: { fontFamily: 'InstrumentSans_400Regular', color: '#746470', fontSize: 14, marginBottom: 8 },
  card: { padding: 22, alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#A44670', borderRadius: 26, backgroundColor: '#FFF', marginBottom: 6 },
  lockedCard: { borderColor: '#D5CDD1', backgroundColor: '#F5F2F0' },
  art: { alignItems: 'center', justifyContent: 'center' },
  lock: { position: 'absolute', backgroundColor: '#FFF9EF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, borderWidth: 1, borderColor: '#D5CDD1' },
  lockText: { fontFamily: 'InstrumentSans_600SemiBold', color: '#645561', fontSize: 12 },
  state: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 10, letterSpacing: 1, color: '#746470', marginTop: 4 },
  earned: { color: '#33845B' },
  badgeTitle: { fontFamily: 'BalooTamma2_700Bold', fontSize: 25, lineHeight: 30, color: '#413547', textAlign: 'center' },
  nickname: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 13, color: '#9D3865' },
  hint: { fontFamily: 'InstrumentSans_400Regular', fontSize: 13, lineHeight: 21, textAlign: 'center', color: '#746470' },
});
