import { useEffect, useSyncExternalStore } from 'react';
import { useLearningApplication } from '../providers/LearningProvider';

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
  return {
    phase: view?.phase ?? (unavailable ? 'unavailable' : state.status === 'error' ? 'error' : state.status === 'needs_onboarding' ? 'needs_onboarding' : 'loading'),
    title: view?.title ?? '', lesson: view?.lesson ?? null, example: view?.example ?? null,
    question: view?.question ?? null, hint: view?.hint ?? null, feedback: view?.feedback ?? null,
    questionNumber: view?.questionNumber ?? null, questionCount: view?.questionCount ?? 0,
    answeredCount: view?.answeredCount ?? 0,
    attemptResult: result ?? null,
    result: save?.outcome?.receipt ?? null, saveOutcome: save?.outcome ?? null,
    submitting: Boolean(result) && (!save || save.status === 'saving'),
    saveStatus: save?.status ?? 'idle',
    error: save?.error ?? view?.error ?? state.error ?? (unavailable ? 'This quest is locked or does not exist.' : null),
    submitAnswer: (answer: { questionId: string; selectedOptionId: string }) => handle?.controller.dispatch({ type: 'answer', revision, ...answer }),
    next: () => handle?.controller.dispatch({ type: 'next', revision }),
    requestHint: () => handle?.controller.dispatch({ type: 'hint', revision }),
    retrySave: () => handle ? application.saveQuest(handle) : Promise.resolve(null),
    retryLoad: application.refresh,
  };
}
