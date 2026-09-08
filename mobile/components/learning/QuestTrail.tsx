import { StyleSheet, Text, View } from 'react-native';
import type { useLearningQuest } from '../../hooks/useLearningQuest';
import { stageThemes } from './learningTheme';

export function QuestTrail({ quest }: { quest: ReturnType<typeof useLearningQuest> }) {
  if (!quest.section) return null;
  const stages = quest.reviewVisualization ? ['lesson', 'visualization', 'example', 'question'] as const : ['lesson', 'example', 'question'] as const;
  const phase = quest.phase === 'feedback' ? 'question' : quest.phase;
  const current = stages.findIndex(item => item === phase);
  return <View style={s.wrap}>
    <View style={s.row}><Text style={s.subject}>{quest.section.subject === 'aptitude' ? 'APTITUDE' : 'DSA'} · PART {quest.section.number} / {quest.section.count}</Text><Text style={s.count}>{current + 1} / {stages.length} stages</Text></View>
    <View style={s.row}>{stages.map((stage, index) => {
      const theme = stageThemes[stage];
      return <View key={stage} style={[s.stage, { backgroundColor: index === current ? theme.tint : '#F5F4F3', borderColor: index === current ? theme.ink : '#E8E3E4' }]}>
        <Text style={[s.label, { color: index === current ? theme.ink : '#746470' }]}>{index < current ? '✓ ' : ''}{stage === 'lesson' ? 'Learn' : stage === 'example' ? 'Example' : stage === 'visualization' ? 'Visualize' : 'Quiz'}</Text>
      </View>;
    })}</View>
  </View>;
}
const s = StyleSheet.create({
  wrap: { gap: 10 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, alignItems: 'center' },
  subject: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 11, color: '#654253' }, count: { fontSize: 11, color: '#746470' },
  stage: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 9, alignItems: 'center' },
  label: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 11 },
});
