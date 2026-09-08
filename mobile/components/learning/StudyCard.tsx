import { SoundPressable as Pressable } from './SoundPressable';
import { StyleSheet, Text, View } from 'react-native';
import type { useLearningQuest } from '../../hooks/useLearningQuest';
import { Visualization } from './Visualization';

export function StudyCard({ quest }: { quest: ReturnType<typeof useLearningQuest> }) {
  const visual = quest.phase === 'visualization';
  const example = quest.phase === 'example';
  const label = visual ? 'Visualize' : example ? 'Solved example' : 'Explain';
  const lead = visual ? 'Follow the algorithm, one step at a time.' : example ? quest.example?.prompt : quest.lesson?.introduction[0];
  const step = quest.visualization;
  return <View style={s.wrap}>
    <View style={s.card}>
      <View style={s.topline}><Text style={s.pill}>{label}</Text><Text style={s.subject}>{quest.section?.subject.toUpperCase()}</Text></View>
      <View style={s.promptArea}><Text style={s.prompt}>{lead}</Text></View>
      <View style={s.body}>
        {quest.phase === 'lesson' && quest.lesson?.introduction.slice(1).map((paragraph, index) => <Text key={index} style={s.text}>{paragraph}</Text>)}
        {example && quest.example?.steps.map((text, index) => <View key={index} style={s.stepRow}>
          <View style={s.number}><Text style={s.numberText}>{index + 1}</Text></View><Text style={[s.text, { flex: 1 }]}>{text}</Text>
        </View>)}
        {visual && step && <Visualization step={step} />}
      </View>
    </View>
    {visual && step && <View style={s.controls}>
      <Pressable accessibilityRole="button" disabled={step.step === 1} onPress={quest.previousVisualizationStep} style={[s.control, step.step === 1 && s.disabled]}><Text style={s.icon}>←</Text><Text>previous</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={quest.resetVisualization} style={s.control}><Text style={s.icon}>↺</Text><Text>restart</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={step.canContinue} onPress={quest.nextVisualizationStep} style={[s.control, step.canContinue && s.disabled]}><Text style={s.icon}>→</Text><Text>next step</Text></Pressable>
    </View>}
    <Pressable accessibilityRole="button" disabled={visual && !step?.canContinue} onPress={quest.next} style={[s.continue, visual && !step?.canContinue && s.disabled]}>
      <Text style={s.continueText}>{visual ? 'Continue to solved example' : example ? 'Try the quiz' : 'Continue'} →</Text>
    </Pressable>
    {visual && step && <View style={s.track}><View style={[s.fill, { width: `${100 * step.step / step.stepCount}%` }]} /></View>}
  </View>;
}
const s = StyleSheet.create({
  wrap: { gap: 18 },
  card: { borderWidth: 1.5, borderColor: '#161616', borderRadius: 26, backgroundColor: '#FAFAFA', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  pill: { backgroundColor: '#65A7F0', color: 'white', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4, fontFamily: 'InstrumentSans_600SemiBold' },
  subject: { color: '#727272', fontSize: 10, letterSpacing: 1.5 },
  promptArea: { minHeight: 140, justifyContent: 'center', padding: 24 },
  prompt: { fontFamily: 'InstrumentSans_400Regular', fontSize: 20, lineHeight: 29, textAlign: 'center', color: '#252525' },
  body: { borderTopWidth: 1, borderColor: '#242424', padding: 20, gap: 20 },
  text: { fontFamily: 'InstrumentSans_400Regular', fontSize: 16, lineHeight: 26, color: '#444' },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  number: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EDF2F7', alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#516788', fontSize: 12 },
  controls: { flexDirection: 'row', gap: 10 },
  control: { flex: 1, minHeight: 76, borderRadius: 22, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', gap: 5 },
  icon: { fontSize: 23, color: '#191919' },
  disabled: { opacity: 0.35 },
  continue: { borderRadius: 24, padding: 16, backgroundColor: '#202020' },
  continueText: { color: 'white', textAlign: 'center', fontSize: 16 },
  track: { height: 5, borderRadius: 3, backgroundColor: '#D9DCDF', marginVertical: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#65A7F0' },
});
