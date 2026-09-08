import { SoundPressable as Pressable } from './SoundPressable';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { useLearningQuest } from '../../hooks/useLearningQuest';
import { visualizationSteps } from '../../domain/visualizations';
import { Visualization } from './Visualization';

type Props = { quest: ReturnType<typeof useLearningQuest> };
type Tool = 'explain' | 'example' | 'hint' | 'visualize';

export function QuizCard({ quest }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool | null>(null);
  const [step, setStep] = useState(0);
  const trace = useMemo(() => quest.reviewVisualization ? visualizationSteps(quest.reviewVisualization) : [], [quest.reviewVisualization]);
  const question = quest.question;
  if (!question) return null;
  const feedback = quest.feedback;
  const sectionTotal = quest.section?.questionCount ?? quest.questionCount;
  const sectionNumber = Math.min(sectionTotal, (quest.section?.answeredCount ?? quest.answeredCount) + (feedback ? 0 : 1));
  const nextLabel = quest.answeredCount === quest.questionCount ? 'See my results' : quest.section?.answeredCount === quest.section?.questionCount ? 'Continue to DSA' : 'Next question';
  const tools: { id: Tool; icon: string; label: string; disabled?: boolean }[] = [
    { id: 'explain', icon: '≡', label: 'explain' },
    { id: 'example', icon: '?', label: 'example' },
    { id: 'hint', icon: '☼', label: 'hint', disabled: !question.hasHint || Boolean(feedback && !quest.hint) },
    { id: 'visualize', icon: '▥', label: 'visualize', disabled: !trace.length },
  ];
  return <View style={s.wrap}>
    <View style={s.card}>
      <View style={s.topline}>
        <Text style={s.pill}>?  {quest.section?.subject.toUpperCase() ?? ''} QUIZ</Text>
        <Text style={s.counter}>{sectionNumber} / {sectionTotal}</Text>
      </View>
      <View style={s.promptArea}><Text style={s.prompt}>{question.prompt}</Text><Text style={s.instruction}>{feedback ? 'Review your answer and the reasoning below.' : 'Choose one answer, then tap Check answer.'}</Text></View>
      <View style={s.answerArea}>
          {question.options.map((option, index) => {
            const chosen = (feedback?.selectedOptionId ?? selected) === option.id;
            const correct = feedback?.correctOptionId === option.id;
            const wrong = Boolean(feedback && chosen && !correct);
            return <Pressable key={option.id} disabled={Boolean(feedback)}
            accessibilityRole="radio" accessibilityState={{ checked: chosen, disabled: Boolean(feedback) }} style={({ pressed }) => [s.option, chosen && s.chosen, correct && s.correctOption, wrong && s.wrongOption, pressed && s.pressed]}
            onPress={() => setSelected(option.id)}>
            <Text style={s.letter}>{String.fromCharCode(65 + index)}</Text>
            <View style={{ flex: 1, gap: 5 }}><Text style={s.optionText}>{option.text}</Text>{feedback && (chosen || correct) && <Text style={[s.optionStatus, { color: wrong ? '#A63F4F' : '#276843' }]}>{correct ? chosen ? '✓ Your answer · correct' : '✓ Correct answer' : '× Your answer'}</Text>}</View>
          </Pressable>; })}
          {!feedback && <Pressable accessibilityRole="button" tapSound={false} disabled={!selected} onPress={() => { if (selected) quest.submitAnswer({ questionId: question.id, selectedOptionId: selected }); }} style={[s.continue, !selected && s.disabled]}><Text style={s.continueText}>Check answer →</Text></Pressable>}
          {feedback && <View accessibilityLiveRegion="polite" style={[s.feedback, { backgroundColor: feedback.correct ? '#E8F6ED' : '#FFF0F1' }]}>
            <Text style={[s.feedbackTitle, { color: feedback.correct ? '#276843' : '#A63F4F' }]}>{feedback.correct ? '✓ Nicely reasoned!' : '× Not quite. Let’s work through it.'}</Text>
            {!feedback.correct && feedback.selectedAnswerFeedback !== feedback.explanation && <Text style={s.detail}>{feedback.selectedAnswerFeedback}</Text>}
            <Text style={s.answerLabel}>WHY THIS ANSWER WORKS</Text><Text style={s.detail}>{feedback.explanation}</Text>
          </View>}
      </View>
    </View>
    <Text style={s.helpLabel}>Need a hand? Revisit the idea.</Text>
    <View style={s.tools}>{tools.map(item => <Pressable key={item.id} disabled={item.disabled}
      accessibilityRole="button" accessibilityState={{ disabled: Boolean(item.disabled), selected: tool === item.id }}
      style={[s.tool, { backgroundColor: item.id === 'hint' ? '#FFF4D8' : item.id === 'visualize' ? '#F1EBFF' : item.id === 'example' ? '#FFF4D8' : '#EAF4FF' }, tool === item.id && s.activeTool, item.disabled && s.disabled]}
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
    {feedback && <Pressable accessibilityRole="button" style={s.continue} onPress={quest.next}><Text style={s.continueText}>{nextLabel} →</Text></Pressable>}
    <View style={s.track}><View style={[s.fill, { width: `${100 * quest.answeredCount / Math.max(1, quest.questionCount)}%` }]} /></View>
  </View>;
}

const s = StyleSheet.create({
  wrap: { gap: 18 },
  card: { borderWidth: 1.5, borderColor: '#EDB8CD', borderRadius: 26, backgroundColor: '#FFF', overflow: 'hidden' },
  topline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFEAF3' },
  pill: { color: '#973D68', fontSize: 11, fontFamily: 'InstrumentSans_600SemiBold' },
  counter: { color: '#727272', fontSize: 12 },
  promptArea: { padding: 20, gap: 12 },
  prompt: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 19, lineHeight: 28, color: '#413547' },
  instruction: { fontFamily: 'InstrumentSans_400Regular', fontSize: 12, color: '#746470', lineHeight: 18 },
  answerArea: { paddingHorizontal: 18, paddingBottom: 20, gap: 12 },
  answerLabel: { fontSize: 10, letterSpacing: 1.5, color: '#707070', textAlign: 'center' },
  answer: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 20, lineHeight: 28, textAlign: 'center', marginVertical: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DEDEDE', borderRadius: 14, padding: 14, backgroundColor: 'white', minHeight: 52 },
  pressed: { backgroundColor: '#EAF2FC', borderColor: '#65A7F0' },
  letter: { color: '#707070', fontSize: 13 },
  optionText: { fontFamily: 'InstrumentSans_400Regular', fontSize: 16, lineHeight: 23, color: '#252525' },
  chosen: { backgroundColor: '#FFF1F7', borderColor: '#973D68', borderWidth: 2 },
  correctOption: { backgroundColor: '#E8F6ED', borderColor: '#39895A', borderWidth: 2 },
  wrongOption: { backgroundColor: '#FFF0F1', borderColor: '#B64A5B', borderWidth: 2 },
  optionStatus: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 11 },
  feedback: { padding: 16, gap: 12, borderRadius: 16 },
  feedbackTitle: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 16, lineHeight: 23 },
  helpLabel: { fontFamily: 'InstrumentSans_600SemiBold', fontSize: 12, color: '#746470' },
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
  continue: { alignSelf: 'stretch', borderRadius: 18, padding: 16, minHeight: 54, backgroundColor: '#973D68' },
  continueText: { color: 'white', textAlign: 'center', fontSize: 15, fontFamily: 'InstrumentSans_600SemiBold' },
  track: { height: 5, borderRadius: 3, backgroundColor: '#D9DCDF', marginVertical: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#65A7F0' },
});
