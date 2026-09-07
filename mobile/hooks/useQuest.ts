import { useState, useSyncExternalStore } from 'react';
import { learningContent } from '../data/learningContent';
import { createQuestController } from '../domain/questController';
import type { ContentCatalog } from '../types/content';

interface QuestOptions {
  readonly campaignId?: string;
  readonly content?: ContentCatalog;
  // Change explicitly to start a fresh practice attempt; ordinary renders preserve it.
  readonly attemptKey?: string;
}

export function useQuest(nodeId: string, options: QuestOptions = {}) {
  const { campaignId = 'starter', content = learningContent, attemptKey = 'initial' } = options;
  const [storedSession, setSession] = useState(() => openSession(content, campaignId, nodeId, attemptKey));
  let session = storedSession;
  // Reset with the input change, not in an effect that would briefly expose the previous quest.
  if (session.content !== content || session.campaignId !== campaignId
    || session.nodeId !== nodeId || session.attemptKey !== attemptKey) {
    session = openSession(content, campaignId, nodeId, attemptKey);
    setSession(session);
  }
  const view = useSyncExternalStore(
    session.controller?.subscribe ?? subscribeToNothing,
    session.controller?.getSnapshot ?? emptySnapshot,
    session.controller?.getSnapshot ?? emptySnapshot,
  );
  const revision = view?.revision ?? -1;
  return {
    phase: view?.phase ?? 'error',
    nodeId, title: view?.title ?? '',
    lesson: view?.lesson ?? null, example: view?.example ?? null,
    question: view?.question ?? null, hint: view?.hint ?? null,
    feedback: view?.feedback ?? null, result: view?.result ?? null,
    questionNumber: view?.questionNumber ?? null,
    questionCount: view?.questionCount ?? 0, answeredCount: view?.answeredCount ?? 0,
    error: session.error ?? view?.error ?? null,
    submitAnswer: (answer: { questionId: string; selectedOptionId: string }) => session.controller?.dispatch({ type: 'answer', revision, ...answer }),
    next: () => session.controller?.dispatch({ type: 'next', revision }),
    requestHint: () => session.controller?.dispatch({ type: 'hint', revision }),
  };
}

const subscribeToNothing = () => () => {};
const emptySnapshot = () => null;

function openSession(content: ContentCatalog, campaignId: string, nodeId: string, attemptKey: string) {
  const identity = { content, campaignId, nodeId, attemptKey };
  try {
    return { ...identity, controller: createQuestController(content, campaignId, nodeId), error: null };
  } catch (error) {
    return { ...identity, controller: null, error: error instanceof Error ? error.message : 'Unable to open quest.' };
  }
}
