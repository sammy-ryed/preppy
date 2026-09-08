import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { useLearningQuest } from '../../hooks/useLearningQuest';
import { questResultSummary } from '../../domain/questResultSummary';
import { nodeStars } from '../../domain/nodeStars';
import { SoundPressable as Pressable } from './SoundPressable';

export function QuestResults({ quest }: { quest: ReturnType<typeof useLearningQuest> }) {
  const [details, setDetails] = useState(false);
  const summary = questResultSummary(quest.attemptResult, quest.saveOutcome);
  if (!summary) return null;
  const { result } = summary;
  const stars = nodeStars(result.performance.score);
  return <View style={s.wrap}>
    <View style={s.hero}>
      <Text style={s.eyebrow}>{summary.replay ? 'PRACTICE COMPLETE' : 'BOTH QUIZZES COMPLETE'}</Text>
      <Text style={s.title}>{summary.replay ? 'Here’s how this attempt went' : 'Another step in your adventure!'}</Text>
      <Text accessibilityLabel={`${stars} out of 3 performance stars`} style={s.stars}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</Text>
      <Text style={s.score}>{result.performance.score}<Text style={s.outOf}> / 100</Text></Text>
      <Text style={s.body}>{summary.correctCount} of {summary.questionCount} answers correct</Text>
      <Text style={s.note}>Weighted performance · stars reflect this attempt</Text>
    </View>
    {summary.sections.map(section => <View key={section.subject} style={[s.card, { borderColor: section.subject === 'aptitude' ? '#EAD194' : '#B4D4F3' }]}>
      <View style={s.row}><Text style={s.heading}>{section.subject === 'aptitude' ? 'Aptitude' : 'DSA'}</Text><Text style={s.heading}>{section.performance.score}/100</Text></View>
      <Text style={s.body}>{section.correctCount} / {section.questionCount} correct</Text>
      <View style={s.track}><View style={[s.fill, { width: `${section.performance.score}%`, backgroundColor: section.subject === 'aptitude' ? '#C08A30' : '#4E8AC0' }]} /></View>
    </View>)}
    <View style={s.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} onPress={() => setDetails(!details)} style={s.row}><Text style={s.heading}>How your score works</Text><Text style={s.heading}>{details ? '−' : '+'}</Text></Pressable>
      {details && <>
        {([['Reasoning', result.performance.points.process, 70], ['Final answers', result.performance.points.accuracy, 20], ['Pace', result.performance.points.time, 10]] as const).map(([label, points, max]) => <View key={label} style={s.row}><Text style={s.body}>{label}</Text><Text style={s.body}>{Math.round(points * 10) / 10} / {max}</Text></View>)}
        <Text style={s.note}>Reasoning questions and final-answer questions contribute separately. Hints don’t reduce your score.</Text>
        {summary.untimed && <Text style={s.note}>These quizzes are untimed. Correct final answers receive half pace credit, so all correct answers score 95/100.</Text>}
        <Text style={s.note}>Stars: 85+ earns 3, 60–84 earns 2, and below 60 earns 1. XP rewards completion plus a final-answer bonus.</Text>
      </>}
    </View>
    {quest.submitting ? <View style={s.saving}><ActivityIndicator color="#39895A" /><Text style={s.body}>Saving your progress…</Text></View> : quest.saveStatus === 'error' ? <View style={s.error}>
      <Text style={s.heading}>Your result hasn’t saved yet</Text><Text style={s.body}>{quest.error}</Text><Pressable accessibilityRole="button" onPress={quest.retrySave} style={s.retry}><Text style={s.heading}>Retry save</Text></Pressable>
    </View> : summary.saved && <View style={s.card}>
      <Text style={s.heading}>{summary.replay ? 'Practice round · no extra XP' : `✓ Progress saved · +${summary.xpAwarded} XP`}</Text>
      {summary.replay ? <Text style={s.note}>Your first completion’s map stars, XP and skills stay saved. The scores above are from this practice attempt.</Text> : <>
        <Text style={s.note}>Skill estimates update gradually from your previous level.</Text>
        {summary.skillChanges.map(change => <View key={change.skillId} style={s.row}><Text style={[s.body, { flex: 1 }]}>{change.skillId.replace(/_/g, ' ')}</Text><Text style={s.heading}>{change.before.mastery} → {change.after.mastery}</Text></View>)}
      </>}
    </View>}
  </View>;
}
const s = StyleSheet.create({
  wrap: { gap: 14 }, hero: { padding: 24, borderRadius: 26, backgroundColor: '#EAF7EF', borderWidth: 1.5, borderColor: '#B3D9C1', alignItems: 'center', gap: 8 },
  eyebrow: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 10, letterSpacing: 1, color: '#32664A' },
  title: { fontFamily: 'BalooTamma2_700Bold', fontSize: 26, lineHeight: 32, color: '#325640', textAlign: 'center' },
  stars: { color: '#A67513', fontSize: 32, letterSpacing: 5 }, score: { fontFamily: 'BalooTamma2_800ExtraBold', fontSize: 48, lineHeight: 58, color: '#325640' }, outOf: { fontSize: 19 },
  card: { padding: 18, gap: 12, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E4DCE2' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 36 },
  heading: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15, color: '#413547' }, body: { fontFamily: 'InstrumentSans_400Regular', fontSize: 14, lineHeight: 21, color: '#645B67' },
  note: { fontFamily: 'InstrumentSans_400Regular', fontSize: 12, lineHeight: 19, color: '#746470' }, track: { height: 7, borderRadius: 5, backgroundColor: '#F1EDF2', overflow: 'hidden' }, fill: { height: '100%', borderRadius: 5 },
  saving: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' }, error: { padding: 18, gap: 12, borderRadius: 20, backgroundColor: '#FFF0F1' }, retry: { padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#B64A5B', borderRadius: 14 },
});
