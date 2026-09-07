import { useEffect, useRef } from 'react';
import { Redirect, useRouter, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLearningQuest } from '../../hooks/useLearningQuest';
import { JourneyHeader } from '../../components/learning/JourneyHeader';
import { QuizCard } from '../../components/learning/QuizCard';
import { StudyCard } from '../../components/learning/StudyCard';

const BLUE = '#3A7BD5';
const BLUE_DARK = '#2563B8';

// ─────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.min(1, current / total) : 0;
  return (
    <View style={pb.track}>
      <View style={[pb.fill, { flex: pct }]} />
      <View style={{ flex: 1 - pct }} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: '#E0E8F8', flexDirection: 'row', overflow: 'hidden', marginBottom: 4 },
  fill: { backgroundColor: BLUE },
});

function ActionButton({ label, onPress, disabled, variant = 'primary' }: {
  label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      style={[s.btn, variant === 'secondary' && s.btnSecondary, disabled && s.btnDisabled]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <Text style={[s.btnText, variant === 'secondary' && s.btnTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// Quest screen
// ─────────────────────────────────────────────────────────────
export default function QuestScreen() {
  const router = useRouter();
  const { nodeId } = useLocalSearchParams<{ nodeId: string }>();
  const quest = useLearningQuest(nodeId);
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); }, [quest.phase, quest.question?.id]);

  // ── Loading ──────────────────────────────────────────────
  if (quest.phase === 'loading') {
    return (
      <View style={[s.root, s.centred]}>
        <ActivityIndicator size="large" color={BLUE} />
        <Text style={s.gateText}>Loading quest…</Text>
      </View>
    );
  }

  // ── Needs onboarding ─────────────────────────────────────
  if (quest.phase === 'needs_onboarding') {
    return <Redirect href="/onboarding" />;
  }

  // ── Unavailable / locked ─────────────────────────────────
  if (quest.phase === 'unavailable') {
    return (
      <View style={[s.root, s.centred]}>
        <Text style={s.lockedIcon}>🔒</Text>
        <Text style={s.lockedTitle}>Quest Locked</Text>
        <Text style={s.lockedBody}>{quest.error ?? 'This quest is locked or does not exist.'}</Text>
        <ActionButton label="← Back to map" onPress={() => router.replace('/map')} />
      </View>
    );
  }

  // ── Load error ───────────────────────────────────────────
  if (quest.phase === 'error') {
    return (
      <View style={[s.root, s.centred]}>
        <Text style={s.errorText}>{quest.error ?? 'Something went wrong.'}</Text>
        <ActionButton label="Retry" onPress={quest.retryLoad} />
        <ActionButton label="← Back to map" onPress={() => router.replace('/map')} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <JourneyHeader />
    <ScrollView ref={scrollRef} style={[s.root, { backgroundColor: '#FFFFFF' }]} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.questTitle}>{quest.title}</Text>
        {quest.section && <Text style={s.sectionTag}>{quest.section.subject.toUpperCase()} · Part {quest.section.number} of {quest.section.count}</Text>}
        {quest.questionCount > 0 && (
          <Text style={s.qProgress}>
            {quest.answeredCount}/{quest.questionCount} answered
          </Text>
        )}
      </View>

      {['lesson', 'example', 'visualization'].includes(quest.phase) && <StudyCard quest={quest} />}

      {(quest.phase === 'question' || quest.phase === 'feedback') && quest.question && (
        <QuizCard key={quest.question.id} quest={quest} />
      )}

      {/* ── Result ────────────────────────────────────────── */}
      {quest.phase === 'result' && (
        <View style={s.section}>
          {quest.result?.sectionPerformances?.map(section => <View key={section.subject}>
            <Text style={s.sectionTag}>{section.subject.toUpperCase()} · {section.performance.score}/100</Text>
          </View>)}
          {/* Saving/pending */}
          {quest.submitting && (
            <View style={s.savingRow}>
              <ActivityIndicator size="small" color={BLUE} />
              <Text style={s.savingText}>Saving your result…</Text>
            </View>
          )}

          {/* Save error + retry */}
          {quest.saveStatus === 'error' && (
            <View style={s.saveErrorCard}>
              <Text style={s.saveErrorText}>{quest.error ?? 'Failed to save.'}</Text>
              <ActionButton label="Retry save" onPress={quest.retrySave} variant="secondary" />
            </View>
          )}

          {/* Committed result */}
          {quest.result && (
            <View style={s.resultCard}>
              <Text style={s.resultHeading}>Quest complete!</Text>
              {quest.result.skillChanges.map(change => (
                <View key={change.skillId} style={{ alignSelf: 'stretch', gap: 6 }}>
                  <Text style={s.sectionTag}>{change.skillId.replace(/_/g, ' ')}</Text>
                  <Text style={s.lessonBody}>{change.before.mastery} → {change.after.mastery} / 100</Text>
                  <ProgressBar current={change.after.mastery} total={100} />
                </View>
              ))}
              {quest.saveOutcome?.status === 'saved' && quest.saveOutcome.xpAwardedNow > 0 && (
                <View style={s.xpBadge}>
                  <Text style={s.xpBadgeText}>+{quest.saveOutcome.xpAwardedNow} XP</Text>
                </View>
              )}
              {quest.saveOutcome?.status === 'saved' && quest.saveOutcome.xpAwardedNow === 0 && (
                <Text style={s.xpNoteText}>XP already awarded for this node.</Text>
              )}
              {quest.saveOutcome?.receipt.unlockedNodeIds && quest.saveOutcome.receipt.unlockedNodeIds.length > 0 && (
                <Text style={s.unlockedText}>
                  🔓 {quest.saveOutcome.receipt.unlockedNodeIds.length} new node{quest.saveOutcome.receipt.unlockedNodeIds.length > 1 ? 's' : ''} unlocked
                </Text>
              )}
            </View>
          )}

          {/* Pending (no committed receipt yet, not submitting, no error) */}
          {!quest.submitting && quest.saveStatus !== 'error' && !quest.result && quest.attemptResult && (
            <View style={s.resultCard}>
              <Text style={s.resultHeading}>Quest finished ✓</Text>
              <Text style={s.pendingText}>Awaiting confirmation…</Text>
            </View>
          )}

          <ActionButton label="← Back to map" onPress={() => router.replace({ pathname: '/map', params: quest.saveOutcome?.status === 'saved' ? { completedNodeId: nodeId, transitionId: quest.saveOutcome.receipt.attemptId } : {} })} />
        </View>
      )}
    </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 20, paddingBottom: 60, gap: 20 },
  centred: { alignItems: 'center', justifyContent: 'center', gap: 16 },

  // Gate
  gateText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#555' },
  errorText: {
    fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#b00020',
    textAlign: 'center', paddingHorizontal: 32,
  },

  // Locked
  lockedIcon: { fontSize: 48 },
  lockedTitle: { fontFamily: 'BalooTamma2_700Bold', fontSize: 22, color: '#1a2a50' },
  lockedBody: {
    fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#5570A0',
    textAlign: 'center', paddingHorizontal: 32,
  },

  // Header
  header: { gap: 4 },
  questTitle: { fontFamily: 'BalooTamma2_700Bold', fontSize: 26, color: '#1a2a50' },
  qProgress: { fontFamily: 'InstrumentSans_400Regular', fontSize: 13, color: '#8898BB' },

  // Section wrapper
  section: { gap: 16 },
  sectionTag: {
    fontFamily: 'InstrumentSans_600SemiBold', fontSize: 11, color: '#8898BB',
    letterSpacing: 1.5, textTransform: 'uppercase',
  },

  // Lesson
  lessonLead: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 17, color: '#1a2a50', lineHeight: 26 },
  lessonBody: { fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#3a4a6a', lineHeight: 24 },

  // Example
  examplePrompt: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#1a2a50', lineHeight: 24 },
  exampleStep: { flexDirection: 'row', gap: 8 },
  exampleStepNum: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: BLUE, width: 20 },
  exampleStepText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#3a4a6a', flex: 1, lineHeight: 22 },

  // Question
  questionPrompt: {
    fontFamily: 'InstrumentSans_600SemiBold', fontSize: 18, color: '#1a2a50', lineHeight: 28,
  },
  options: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1.5, borderColor: '#E0E8F8',
  },
  optionDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#A0B4D8', backgroundColor: 'transparent',
  },
  optionText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 15, color: '#1a2a50', flex: 1 },
  hintText: {
    fontFamily: 'InstrumentSans_400Regular', fontSize: 13, color: '#5570A0',
    backgroundColor: '#EEF2FF', borderRadius: 10, padding: 12, lineHeight: 20,
  },

  // Feedback
  feedbackCard: {
    borderRadius: 16, padding: 20, gap: 8,
    borderWidth: 1.5,
  },
  feedbackCorrect: { backgroundColor: '#F0FFF4', borderColor: '#A8D5B5' },
  feedbackWrong: { backgroundColor: '#FFF5F5', borderColor: '#FFBDBD' },
  feedbackIcon: { fontSize: 28 },
  feedbackHeading: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 18, color: '#1a2a50' },
  feedbackExplanation: { fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#3a4a6a', lineHeight: 22 },

  // Result / saving
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  savingText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#5570A0' },
  saveErrorCard: {
    backgroundColor: '#FFF5F5', borderRadius: 14, padding: 16, gap: 10,
    borderWidth: 1, borderColor: '#FFBDBD',
  },
  saveErrorText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#b00020' },
  resultCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 24, gap: 14,
    borderWidth: 1.5, borderColor: '#C0CFF5', alignItems: 'center',
    shadowColor: '#1a2a50', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  resultHeading: { fontFamily: 'BalooTamma2_700Bold', fontSize: 24, color: '#1a2a50' },
  xpBadge: { backgroundColor: BLUE, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20 },
  xpBadgeText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 18, color: '#FFFFFF' },
  xpNoteText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 13, color: '#8898BB' },
  unlockedText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 14, color: '#1B6B35' },
  pendingText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 14, color: '#8898BB' },

  // Buttons
  btn: {
    backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: BLUE,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, color: '#FFFFFF' },
  btnTextSecondary: { color: BLUE_DARK },
});
