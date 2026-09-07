import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { appContent as learningContent } from '../data/appContent';
import { connectLearningBackend } from '../services/backend';
import { createLearningApplication } from '../services/learningApplication';
import type { LearningApplication } from '../types/application';

const LearningContext = createContext<LearningApplication | null>(null);

export function LearningProvider({ children, application }: { children: ReactNode; application?: LearningApplication }) {
  const [store] = useState(() => application ?? createLearningApplication(learningContent, connectLearningBackend));
  useEffect(() => { void store.bootstrap(); }, [store]);
  return <LearningContext.Provider value={store}>{children}</LearningContext.Provider>;
}

export function useLearningApplication() {
  const application = useContext(LearningContext);
  if (!application) throw new Error('Learning hooks must be rendered inside LearningProvider.');
  const state = useSyncExternalStore(application.subscribe, application.getSnapshot, application.getSnapshot);
  return { application, state };
}
