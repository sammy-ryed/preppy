import type { ContentCatalog } from '../types/content';
import type { EvaluatedAnswer } from '../types/learning';
import type { QuestAction, QuestController, QuestPhase, QuestSessionView } from '../types/questSession';
import { evaluateAnswer } from './evaluateAnswer';
import { calculateNodePerformance } from './scoring';
import { validateContent } from './validateContent';

// An in-memory attempt only. The caller must check durable node availability before launch.
export function createQuestController(content: ContentCatalog, campaignId: string, nodeId: string): QuestController {
  const issues = validateContent(content);
  if (issues.length) throw new Error(`Invalid learning content: ${issues.join('; ')}`);
  const campaign = content.campaigns.find(item => item.id === campaignId);
  const node = campaign?.nodes.find(item => item.id === nodeId);
  if (!campaign || !node) throw new Error(`Unknown quest node: ${campaignId}/${nodeId}`);
  const quest = content.quests.find(item => item.id === node.questId)!;
  const lesson = content.lessons.find(item => item.id === quest.lessonId)!;
  const questions = quest.questionIds.map(id => content.questions.find(question => question.id === id)!);
  const listeners = new Set<() => void>();
  let phase: QuestPhase = 'lesson';
  let revision = 0;
  let questionIndex = 0;
  let hintUsed = false;
  let error: string | null = null;
  const answers: EvaluatedAnswer[] = [];

  function buildView(): QuestSessionView {
    const current = questions[questionIndex]!;
    const showingQuestion = phase === 'question' || phase === 'feedback';
    return Object.freeze<QuestSessionView>({
      revision, phase, nodeId: node!.id, title: node!.title,
      lesson: phase === 'lesson' ? { title: lesson.title, introduction: lesson.introduction } : null,
      example: phase === 'example' ? lesson.workedExample : null,
      // Never expose answer keys, explanations, or unrequested hints in a question view.
      question: showingQuestion ? {
        id: current.id, type: current.type, prompt: current.prompt,
        options: current.options, skillId: current.skillId, difficulty: current.difficulty,
        hasHint: Boolean(current.hint),
      } : null,
      hint: showingQuestion && hintUsed ? current.hint ?? null : null,
      feedback: phase === 'feedback' ? answers[answers.length - 1]! : null,
      questionNumber: showingQuestion ? questionIndex + 1 : null,
      questionCount: questions.length, answeredCount: answers.length,
      result: phase === 'result' ? {
        campaignId: campaign!.id, campaignVersion: campaign!.version,
        nodeId: node!.id, questId: quest.id, questVersion: quest.version,
        questionVersions: Object.fromEntries(questions.map(question => [question.id, question.version])),
        performance: calculateNodePerformance(answers), answers: Object.freeze([...answers]),
        persistence: 'not_saved',
      } : null,
      error,
    });
  }
  let view = buildView();

  function dispatch(action: QuestAction) {
    // UI callbacks carry the revision they rendered. Double taps and stale callbacks are no-ops.
    if (action.revision !== revision || phase === 'result') return;
    const question = questions[questionIndex]!;
    if (action.type === 'next') {
      if (phase === 'lesson') phase = 'example';
      else if (phase === 'example') phase = 'question';
      else if (phase === 'feedback') {
        if (answers.length === questions.length) phase = 'result';
        else { questionIndex += 1; hintUsed = false; phase = 'question'; }
      } else return; // Cannot advance an unanswered question.
      error = null;
    } else if (action.type === 'hint') {
      if (phase !== 'question' || hintUsed || !question.hint) return;
      hintUsed = true;
      error = null;
    } else {
      if (phase !== 'question' || action.questionId !== question.id) return;
      try {
        const answer = evaluateAnswer(question, {
          questionId: question.id, selectedOptionId: action.selectedOptionId,
          hintUsed, activeSeconds: null,
        });
        answers.push(Object.freeze(answer));
        phase = 'feedback';
        error = null;
      } catch {
        error = 'Choose one of the available answers.';
      }
    }
    revision += 1;
    view = buildView();
    listeners.forEach(listener => listener());
  }

  return {
    getSnapshot: () => view,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispatch,
  };
}
