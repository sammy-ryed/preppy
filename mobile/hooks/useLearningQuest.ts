import { useEffect, useSyncExternalStore } from 'react';
import { useLearningApplication } from '../providers/LearningProvider';
import { playSound } from '../services/soundEffects';

const subscribeToNothing = () => () => {};
const emptySnapshot = () => null;

// Connected mode. useQuest remains the standalone, unsaved content-preview hook.
export function useLearningQuest(nodeId: string) {
  const { application, state } = useLearningApplication();
  const handle = application.getQuest(nodeId);
  const view = useSyncExternalStore(handle?.controller.subscribe ?? subscribeToNothing,
    handle?.controller.getSnapshot ?? emptySnapshot, handle?.controller.getSnapshot ?? emptySnapshot);
  const save = handle ? state.saves[handle.attemptId] : undefined;
  const result = view?.result;
  useEffect(() => {
    if (handle && result && !save) void application.saveQuest(handle);
  }, [application, handle, result, save]);
  const revision = view?.revision ?? -1;
  const unavailable = state.status === 'ready' && !handle;
  const node = application.content.campaigns.find(item => item.id === state.profile?.campaignId)?.nodes.find(item => item.id === nodeId);
  const definition = application.content.quests.find(item => item.id === node?.questId);
  const section = definition?.sections?.[(view?.section?.number ?? 1) - 1];
  const reviewLesson = application.content.lessons.find(item => item.id === (section?.lessonId ?? definition?.lessonId));
  return {
    reviewLesson,
    reviewVisualization: section?.visualization,
    phase: view?.phase ?? (unavailable ? 'unavailable' : state.status === 'error' ? 'error' : state.status === 'needs_onboarding' ? 'needs_onboarding' : 'loading'),
    title: view?.title ?? '', lesson: view?.lesson ?? null, example: view?.example ?? null,
    section: view?.section ?? null, visualization: view?.visualization ?? null,
    question: view?.question ?? null, hint: view?.hint ?? null, feedback: view?.feedback ?? null,
    questionNumber: view?.questionNumber ?? null, questionCount: view?.questionCount ?? 0,
    answeredCount: view?.answeredCount ?? 0,
    attemptResult: result ?? null,
    result: save?.outcome?.receipt ?? null, saveOutcome: save?.outcome ?? null,
    submitting: Boolean(result) && (!save || save.status === 'saving'),
    saveStatus: save?.status ?? 'idle',
    error: save?.error ?? view?.error ?? state.error ?? (unavailable ? 'This quest is locked or does not exist.' : null),
    submitAnswer: (answer: { questionId: string; selectedOptionId: string }) => {
      if (!handle || handle.controller.getSnapshot().phase !== 'question') return;
      handle.controller.dispatch({ type: 'answer', revision, ...answer });
      const feedback = handle.controller.getSnapshot().feedback;
      if (feedback?.questionId === answer.questionId) playSound(feedback.correct ? 'correct' : 'wrong', `${handle.attemptId}:${feedback.questionId}`);
    },
    next: () => handle?.controller.dispatch({ type: 'next', revision }),
    requestHint: () => handle?.controller.dispatch({ type: 'hint', revision }),
    nextVisualizationStep: () => handle?.controller.dispatch({ type: 'visualization_next', revision }),
    previousVisualizationStep: () => handle?.controller.dispatch({ type: 'visualization_previous', revision }),
    resetVisualization: () => handle?.controller.dispatch({ type: 'visualization_reset', revision }),
    retrySave: () => handle ? application.saveQuest(handle) : Promise.resolve(null),
    retryLoad: application.refresh,
  };
}
