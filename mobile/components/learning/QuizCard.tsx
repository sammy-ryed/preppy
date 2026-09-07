import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { useLearningQuest } from '../../hooks/useLearningQuest';
import { visualizationSteps } from '../../domain/visualizations';
import { Visualization } from './Visualization';

type Props = { quest: ReturnType<typeof useLearningQuest> };
type Tool = 'explain' | 'example' | 'hint' | 'visualize';

export function QuizCard({ quest }: Props) {
  const [tool, setTool] = useState<Tool | null>(null);
  const [step, setStep] = useState(0);
  const trace = useMemo(() => quest.reviewVisualization ? visualizationSteps(quest.reviewVisualization) : [], [quest.reviewVisualization]);
  const question = quest.question;
  if (!question) return null;
  const feedback = quest.feedback;
  const tools: { id: Tool; icon: string; label: string; disabled?: boolean }[] = [
    { id: 'explain', icon: '≡', label: 'explain' },
    { id: 'example', icon: '?', label: 'example' },
    { id: 'hint', icon: '☼', label: 'hint', disabled: !question.hasHint },
    { id: 'visualize', icon: '▥', label: 'visualize', disabled: !trace.length },
  ];
  return <View style={s.wrap}>
    <View style={s.card}>
      <View style={s.topline}>
        <Text style={s.pill}>{feedback ? 'Reviewed' : 'Quiz'}</Text>
        <Text style={s.counter}>{quest.questionNumber} / {quest.questionCount}</Text>
      </View>
      <View style={s.promptArea}><Text style={s.prompt}>{question.prompt}</Text></View>
      <View style={s.answerArea}>
        {feedback ? <>
          <Text style={s.answerLabel}>CORRECT ANSWER</Text>
          <Text style={s.answer}>{question.options.find(option => option.id === feedback.correctOptionId)?.text}</Text>
          <Text style={s.detail}>{feedback.selectedAnswerFeedback}</Text>
          <Text style={s.detail}>{feedback.explanation}</Text>
        </> : <>
          <Text style={s.answerLabel}>CHOOSE YOUR ANSWER</Text>
          {question.options.map((option, index) => <Pressable key={option.id}
            accessibilityRole="button" style={({ pressed }) => [s.option, pressed && s.pressed]}
            onPress={() => quest.submitAnswer({ questionId: question.id, selectedOptionId: option.id })}>
            <Text style={s.letter}>{String.fromCharCode(65 + index)}</Text>
            <Text style={s.optionText}>{option.text}</Text>
          </Pressable>)}
        </>}
      </View>
    </View>
    <View style={s.tools}>{tools.map(item => <Pressable key={item.id} disabled={item.disabled}
      accessibilityRole="button" accessibilityState={{ disabled: Boolean(item.disabled), selected: tool === item.id }}
      style={[s.tool, tool === item.id && s.activeTool, item.disabled && s.disabled]}
      onPress={() => { if (item.id === 'hint') quest.requestHint(); setTool(tool === item.id ? null : item.id); }}>
      <Text style={s.toolIcon}>{item.icon}</Text><Text style={s.toolLabel}>{item.label}</Text>
    </Pressable>)}</View>
    {tool && <View style={s.review}>
      {tool === 'explain' && quest.reviewLesson?.introduction.map((text, i) => <Text key={i} style={s.detail}>{text}</Text>)}
      {tool === 'example' && <>
        <Text style={s.detail}>{quest.reviewLesson?.workedExample.prompt}</Text>
        {quest.reviewLesson?.workedExample.steps.map((text, i) => <Text key={i} style={s.detail}>{i + 1}. {text}</Text>)}
      </>}
      {tool === 'hint' && <Text style={s.detail}>{quest.hint}</Text>}
      {tool === 'visualize' && trace[step] && <>
        <Visualization step={{ ...trace[step], step: step + 1, stepCount: trace.length, canContinue: step === trace.length - 1 }} />
        <View style={s.tools}>
          <Pressable accessibilityRole="button" disabled={step === 0} onPress={() => setStep(step - 1)} style={[s.tool, step === 0 && s.disabled]}><Text>Previous</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={step === trace.length - 1} onPress={() => setStep(step + 1)} style={[s.tool, step === trace.length - 1 && s.disabled]}><Text>Next</Text></Pressable>
        </View>
      </>}
    </View>}
    {feedback ? <View style={s.footer}>
      <View style={[s.outcome, { backgroundColor: feedback.correct ? '#80CEA1' : '#EE9298' }]}><Text style={s.outcomeIcon}>{feedback.correct ? '✓' : '×'}</Text></View>
      <Text style={s.footerTitle}>{feedback.correct ? 'You got it!' : 'Keep learning'}</Text>
      <Pressable accessibilityRole="button" style={s.continue} onPress={quest.next}><Text style={s.continueText}>Continue →</Text></Pressable>
    </View> : <Text style={s.footerTitle}>What do you think?</Text>}
    <View style={s.track}><View style={[s.fill, { width: `${100 * quest.answeredCount / Math.max(1, quest.questionCount)}%` }]} /></View>
  </View>;
}

const s = StyleSheet.create({
  wrap: { gap: 18 },
  card: { borderWidth: 1.5, borderColor: '#161616', borderRadius: 26, backgroundColor: '#FAFAFA', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 },
  pill: { backgroundColor: '#65A7F0', color: 'white', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4, fontFamily: 'InstrumentSans_600SemiBold' },
  counter: { color: '#727272', fontSize: 12 },
  promptArea: { minHeight: 145, justifyContent: 'center', padding: 24 },
  prompt: { fontFamily: 'InstrumentSans_400Regular', fontSize: 20, lineHeight: 29, textAlign: 'center', color: '#252525' },
  answerArea: { minHeight: 185, borderTopWidth: 1, borderColor: '#242424', padding: 20, justifyContent: 'center', gap: 12 },
  answerLabel: { fontSize: 10, letterSpacing: 1.5, color: '#707070', textAlign: 'center' },
  answer: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 20, lineHeight: 28, textAlign: 'center', marginVertical: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DEDEDE', borderRadius: 14, padding: 14, backgroundColor: 'white', minHeight: 52 },
  pressed: { backgroundColor: '#EAF2FC', borderColor: '#65A7F0' },
  letter: { color: '#707070', fontSize: 13 },
  optionText: { flex: 1, fontFamily: 'InstrumentSans_400Regular', fontSize: 16, lineHeight: 23, color: '#252525' },
  tools: { flexDirection: 'row', gap: 8 },
  tool: { flex: 1, minHeight: 76, borderRadius: 22, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 4 },
  activeTool: { borderColor: '#65A7F0', backgroundColor: '#EDF5FF' },
  disabled: { opacity: 0.35 },
  toolIcon: { fontSize: 23, color: '#191919' },
  toolLabel: { fontSize: 12, color: '#303030', fontFamily: 'InstrumentSans_400Regular' },
  review: { padding: 18, borderRadius: 20, backgroundColor: '#F5F5F5', gap: 12 },
  detail: { fontSize: 15, lineHeight: 24, color: '#444', fontFamily: 'InstrumentSans_400Regular' },
  footer: { alignItems: 'center', gap: 12 },
  outcome: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  outcomeIcon: { fontSize: 30, color: '#192B21' },
  footerTitle: { textAlign: 'center', fontSize: 21, fontFamily: 'InstrumentSans_600SemiBold', color: '#202020' },
  continue: { alignSelf: 'stretch', borderRadius: 24, padding: 16, backgroundColor: '#202020' },
  continueText: { color: 'white', textAlign: 'center', fontSize: 16 },
  track: { height: 5, borderRadius: 3, backgroundColor: '#D9DCDF', marginVertical: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#65A7F0' },
});
