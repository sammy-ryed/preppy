import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { useGameSession } from '../../hooks/useGameSession';
import { JourneyHeader } from './JourneyHeader';

type Props = { game: ReturnType<typeof useGameSession>; onBack: () => void };
const bimbo = {
  break1: require('../../assets/bmo1.png'),
  break2: require('../../assets/bmo2.png'),
  finalBoss: require('../../assets/bmo3.png'),
};

export function GameLobby({ game, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const checkpoint = game.checkpoint;
  const locked = !checkpoint || checkpoint.status === 'locked';
  const skipped = checkpoint?.status === 'skipped' || game.status === 'skipped';
  const completed = checkpoint?.status === 'completed' || game.status === 'completed';
  const resolved = skipped || completed;
  const boss = checkpoint?.stage === 'finalBoss';
  const canPlay = !locked && !resolved && Boolean(game.uri) && Platform.OS !== 'web';
  const title = locked ? 'A little further to go' : skipped ? 'On with your journey!' : completed ? 'Nicely played!' : boss ? 'One final adventure' : 'Time for a little adventure';
  const description = locked ? 'Finish the preceding quests to unlock this game break.'
    : skipped ? 'Break skipped. Your learning progress is saved.'
    : completed ? 'This checkpoint is complete. Head back to see your journey.'
    : boss ? 'You made it through the learning journey. Bimbo has one last challenge for you.'
    : 'You’ve earned a breather. Join Bimbo for a game, or keep going with your quests.';
  return <View style={s.screen}>
    <JourneyHeader compact />
    <ScrollView contentContainerStyle={[s.content, { paddingBottom: Math.max(24, insets.bottom + 16) }]} showsVerticalScrollIndicator={false}>
      <View style={s.card}>
        <View style={s.cardTop}>
          <Text style={s.pill}>{resolved ? 'CHECKPOINT SAVED' : boss ? 'FINAL CHALLENGE' : 'GAME BREAK'}</Text>
          {checkpoint && <Text style={s.chapter}>After node {boss ? 15 : checkpoint.stage === 'break2' ? 10 : 5}</Text>}
        </View>
        {game.loading ? <View style={s.loading}><ActivityIndicator color="#65A7F0" /><Text style={s.body}>Getting your checkpoint ready…</Text></View> : <>
          <View style={s.hero}>
            <View style={s.halo} />
            <Image source={bimbo[checkpoint?.stage ?? 'break1']} style={[s.bimbo, locked && s.muted]} resizeMode="contain" accessibilityLabel="Bimbo waiting for the next adventure" />
          </View>
          <View style={s.intro}>
            <Text style={s.title}>{title}</Text>
            <Text style={s.body}>{description}</Text>
          </View>
          <View style={s.actions}>
            {!locked && !resolved && <>
              <View style={s.infoRow}><Text style={s.info}>↔ Landscape</Text><Text style={s.info}>✦ Bonus XP for a win</Text></View>
              {!game.uri && <Text style={s.note}>The game isn’t online yet. You can still skip this break.</Text>}
              {Platform.OS === 'web' && <Text style={s.note}>Open PREPPY on your phone to play.</Text>}
              {canPlay && <Pressable accessibilityRole="button" style={({ pressed }) => [s.play, pressed && s.pressed]} onPress={() => void game.launch()}>
                <Text style={s.playText}>Let’s play</Text><Text style={s.playText}>→</Text>
              </Pressable>}
              {checkpoint?.canSkip && <>
                <Pressable accessibilityRole="button" style={({ pressed }) => [s.skip, pressed && s.pressed]} onPress={() => void game.skip()}><Text style={s.skipText}>Skip & keep going</Text></Pressable>
                <Text style={s.footnote}>Skipping keeps your quest XP. No game bonus is awarded.</Text>
              </>}
            </>}
            {completed && game.xp > 0 && <Text style={s.reward}>+{game.xp} XP earned</Text>}
            {resolved && <Pressable accessibilityRole="button" style={s.play} onPress={onBack}><Text style={s.playText}>Back to the journey</Text><Text style={s.playText}>→</Text></Pressable>}
          </View>
        </>}
      </View>
      {game.error && <View style={s.errorBox}><Text style={s.error}>{game.error}</Text><Pressable accessibilityRole="button" style={s.skip} onPress={() => void game.retry()}><Text style={s.skipText}>Try again</Text></Pressable></View>}
      {!resolved && <Pressable accessibilityRole="button" style={s.back} onPress={onBack}><Text style={s.backText}>← Back to map</Text></Pressable>}
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, paddingTop: 12, gap: 18, width: '100%', maxWidth: 520, alignSelf: 'center' },
  card: { borderWidth: 1.5, borderColor: '#252525', borderRadius: 26, backgroundColor: '#FAFAFA', overflow: 'hidden', shadowColor: '#30212C', shadowOpacity: 0.1, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  cardTop: { padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: '#65A7F0', fontFamily: 'InstrumentSans_600SemiBold', color: '#FFF', fontSize: 10, letterSpacing: 0.6 },
  chapter: { fontFamily: 'InstrumentSans_400Regular', fontSize: 12, color: '#727272' },
  hero: { height: 162, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  halo: { position: 'absolute', width: 156, height: 156, borderRadius: 78, backgroundColor: '#FCE5EE' },
  bimbo: { width: 145, height: 152 },
  muted: { opacity: 0.45 },
  intro: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, gap: 8 },
  title: { fontFamily: 'BalooTamma2_700Bold', fontSize: 28, lineHeight: 34, color: '#252525', textAlign: 'center' },
  body: { fontFamily: 'InstrumentSans_400Regular', fontSize: 15, lineHeight: 23, color: '#555', textAlign: 'center' },
  actions: { borderTopWidth: 1, borderTopColor: '#DADADA', padding: 20, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  info: { fontFamily: 'InstrumentSans_400Regular', fontSize: 11, color: '#657080', backgroundColor: '#EDF1F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  play: { minHeight: 54, borderRadius: 20, backgroundColor: '#FFB4D2', borderWidth: 1.5, borderColor: '#C6618C', paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 17, color: '#60233F' },
  pressed: { opacity: 0.75 },
  skip: { minHeight: 50, borderRadius: 20, borderWidth: 1.5, borderColor: '#DEDEDE', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', padding: 12 },
  skipText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#444' },
  footnote: { fontFamily: 'InstrumentSans_400Regular', color: '#767676', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  note: { fontFamily: 'InstrumentSans_400Regular', color: '#555', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  back: { alignItems: 'center', padding: 12 },
  backText: { fontFamily: 'InstrumentSans_600SemiBold', color: '#64748B', fontSize: 14 },
  reward: { fontFamily: 'BalooTamma2_700Bold', fontSize: 23, color: '#287951', textAlign: 'center' },
  errorBox: { padding: 16, gap: 12, borderRadius: 20, backgroundColor: '#FFF1F3' },
  error: { fontFamily: 'InstrumentSans_400Regular', color: '#A52F4A', fontSize: 14, lineHeight: 21 },
  loading: { padding: 32, gap: 16 },
});
