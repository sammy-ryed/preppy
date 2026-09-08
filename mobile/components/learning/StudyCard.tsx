import { SoundPressable as Pressable } from './SoundPressable';
import { StyleSheet, Text, View } from 'react-native';
import type { useLearningQuest } from '../../hooks/useLearningQuest';
import { Visualization } from './Visualization';
import { stageThemes } from './learningTheme';

export function StudyCard({ quest }: { quest: ReturnType<typeof useLearningQuest> }) {
  const visual = quest.phase === 'visualization';
  const example = quest.phase === 'example';
  const theme = stageThemes[visual ? 'visualization' : example ? 'example' : 'lesson'];
  const step = quest.visualization;
  const nextLabel = visual ? 'Explore the solved example' : example ? 'Ready? Try the quiz' : quest.reviewVisualization ? 'See it in action' : 'See a solved example';
  return <View style={s.wrap}>
    <View style={[s.card, { borderColor: theme.border }]}>
      <View style={[s.heading, { backgroundColor: theme.tint }]}>
        <Text style={[s.eyebrow, { color: theme.ink }]}>{theme.icon}  {theme.label.toUpperCase()}</Text>
        <Text style={s.title}>{visual ? 'Watch the logic unfold' : example ? 'Let’s solve one together' : quest.lesson?.title}</Text>
        <Text style={s.caption}>{visual ? 'Use Next step to see what changes and why.' : example ? 'Read the problem, then follow each numbered step.' : 'Understand the idea before you try it yourself.'}</Text>
      </View>
      <View style={s.body}>
        {quest.phase === 'lesson' && quest.lesson?.introduction.map((paragraph, index) => <View key={index} style={[s.concept, index === 0 && { backgroundColor: theme.tint }]}>
          <Text style={[s.smallLabel, { color: theme.ink }]}>{index === 0 ? 'THE BIG IDEA' : `KEY IDEA ${index}`}</Text>
          <Text style={s.text}>{paragraph}</Text>
        </View>)}
        {example && <>
          <View style={[s.concept, { backgroundColor: theme.tint }]}><Text style={[s.smallLabel, { color: theme.ink }]}>THE PROBLEM</Text><Text style={s.text}>{quest.example?.prompt}</Text></View>
          {quest.example?.steps.map((text, index) => <View key={index} style={s.stepRow}>
            <View style={[s.number, { backgroundColor: theme.tint }]}><Text style={[s.numberText, { color: theme.ink }]}>{index + 1}</Text></View>
            <View style={s.stepCopy}><Text style={[s.smallLabel, { color: theme.ink }]}>{index === quest.example!.steps.length - 1 ? 'RESULT' : `STEP ${index + 1}`}</Text><Text style={s.text}>{text}</Text></View>
          </View>)}
        </>}
        {visual && step && <Visualization step={step} />}
      </View>
    </View>
    {visual && step && <>
      <View style={s.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous visualization step" disabled={step.step === 1} onPress={quest.previousVisualizationStep} style={[s.control, step.step === 1 && s.disabled]}><Text style={s.controlText}>← Back</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Restart visualization" disabled={step.step === 1} onPress={quest.resetVisualization} style={[s.control, step.step === 1 && s.disabled]}><Text style={s.controlText}>↺ Reset</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={step.canContinue} onPress={quest.nextVisualizationStep} style={[s.control, { backgroundColor: theme.tint, borderColor: theme.border }, step.canContinue && s.disabled]}><Text style={[s.controlText, { color: theme.ink }]}>Next step →</Text></Pressable>
      </View>
      <Text style={s.caption}>{step.canContinue ? 'You’ve reached the end. Now apply the idea to an example.' : `${step.stepCount - step.step} more steps to explore before the example.`}</Text>
    </>}
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: visual && !step?.canContinue }} disabled={visual && !step?.canContinue} onPress={quest.next} style={[s.continue, { backgroundColor: theme.ink }, visual && !step?.canContinue && s.disabled]}>
      <Text style={s.continueText}>{nextLabel} →</Text>
    </Pressable>
  </View>;
}
const s = StyleSheet.create({
  wrap: { gap: 14 },
  card: { borderWidth: 1.5, borderRadius: 26, backgroundColor: '#FFF', overflow: 'hidden' },
  heading: { padding: 22, gap: 8 },
  eyebrow: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 11, letterSpacing: 1 },
  title: { fontFamily: 'BalooTamma2_700Bold', fontSize: 25, lineHeight: 32, color: '#413547' },
  caption: { fontFamily: 'InstrumentSans_400Regular', fontSize: 13, lineHeight: 20, color: '#6B6270' },
  body: { padding: 18, gap: 18 },
  concept: { padding: 14, gap: 8, borderRadius: 16, backgroundColor: '#F8F9FB' },
  smallLabel: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 10, letterSpacing: 0.6 },
  text: { fontFamily: 'InstrumentSans_400Regular', fontSize: 16, lineHeight: 25, color: '#413D48' },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepCopy: { flex: 1, gap: 6 },
  number: { width: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 13 },
  controls: { flexDirection: 'row', gap: 8 },
  control: { flex: 1, minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: '#E1DDE7', backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', padding: 6 },
  controlText: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 12, color: '#64576C' },
  disabled: { opacity: 0.4 },
  continue: { minHeight: 54, borderRadius: 18, padding: 16, justifyContent: 'center' },
  continueText: { color: '#FFF', textAlign: 'center', fontFamily: 'InstrumentSans_600SemiBold', fontSize: 15 },
});
