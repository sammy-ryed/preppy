import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSkills } from '../hooks/useSkills';

const BLUE = '#3A7BD5';

function MasteryBar({ mastery }: { mastery: number }) {
  const pct = Math.min(100, Math.max(0, mastery)) / 100;
  return (
    <View style={mb.track}>
      <View style={[mb.fill, { flex: pct || 0.01 }]} />
      <View style={{ flex: 1 - (pct || 0.01) }} />
    </View>
  );
}
const mb = StyleSheet.create({
  track: {
    height: 8, borderRadius: 4, backgroundColor: '#E0E8F8',
    flexDirection: 'row', overflow: 'hidden',
  },
  fill: { backgroundColor: BLUE },
});

export default function SkillsScreen() {
  const router = useRouter();
  const skills = useSkills();

  if (skills.loading) {
    return (
      <View style={[s.root, s.centred]}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={s.gateText}>Loading skills…</Text>
      </View>
    );
  }

  if (skills.error) {
    return (
      <View style={[s.root, s.centred]}>
        <Text style={s.errorText}>{skills.error}</Text>
        <Pressable style={s.retryBtn} onPress={skills.retry} accessibilityRole="button">
          <Text style={s.retryBtnText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.heading}>Skills</Text>
      <Text style={s.subheading}>
        Mastery is 0–100 and builds from quiz evidence. Evidence count shows how many answers
        have informed each estimate.
      </Text>

      {skills.skills.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>📚</Text>
          <Text style={s.emptyText}>Complete quests to build up your skill profile.</Text>
        </View>
      ) : (
        <View style={s.skillList}>
          {skills.skills.map((skill) => (
            <View key={skill.id} style={s.skillCard}>
              <View style={s.skillHeader}>
                <Text style={s.skillLabel}>{skill.label}</Text>
                <Text style={s.skillMastery}>{Math.round(skill.mastery)}%</Text>
              </View>
              <MasteryBar mastery={skill.mastery} />
              <Text style={s.evidenceText}>
                {skill.evidenceCount === 0
                  ? 'Self-assessed only'
                  : `${skill.evidenceCount} answer${skill.evidenceCount > 1 ? 's' : ''} recorded`}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={s.backBtn}
        onPress={() => router.replace('/map')}
        accessibilityRole="button"
        accessibilityLabel="Return to map"
      >
        <Text style={s.backBtnText}>← Back to map</Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 20, paddingBottom: 60, gap: 20 },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },

  gateText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#555' },
  errorText: {
    fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#b00020',
    textAlign: 'center', paddingHorizontal: 32,
  },
  retryBtn: {
    backgroundColor: BLUE, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 20,
  },
  retryBtnText: { color: '#fff', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15 },

  heading: { fontFamily: 'BalooTamma2_700Bold', fontSize: 28, color: '#1a2a50' },
  subheading: {
    fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#5570A0', lineHeight: 22,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 32,
    alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#E0E8F8',
  },
  emptyIcon: { fontSize: 40 },
  emptyText: {
    fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#5570A0',
    textAlign: 'center',
  },

  skillList: { gap: 14 },
  skillCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, gap: 10,
    borderWidth: 1.5, borderColor: '#E0E8F8',
    shadowColor: '#1a2a50', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  skillLabel: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 17, color: '#1a2a50' },
  skillMastery: { fontFamily: 'BalooTamma2_700Bold', fontSize: 20, color: BLUE },
  evidenceText: {
    fontFamily: 'InstrumentSans_400Regular', fontSize: 12, color: '#8898BB', marginTop: 2,
  },

  backBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E8F8',
  },
  backBtnText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: BLUE },
});
