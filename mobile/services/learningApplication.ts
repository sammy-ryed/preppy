import type { ContentCatalog } from '../types/content';
import type { LearningApplication, LearningApplicationState, LearningBackend, LearningQuestHandle, OnboardingProfile, QuestSaveState } from '../types/application';
import type { SaveOutcome, UserProgress } from '../types/progress';
import { createQuestController } from '../domain/questController';
import { getCampaignProgress } from '../domain/progression';
import { validateOnboarding } from '../domain/onboarding';
import { toProgressSnapshot } from './learningService';

let sequence = 0;
// Operation identifier only, never an authentication/session credential.
const makeAttemptId = () => `attempt-${Date.now().toString(36)}-${++sequence}-${Math.random().toString(36).slice(2)}`;
const message = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please retry.';

export function createLearningApplication(
  content: ContentCatalog, connect: () => Promise<LearningBackend>, nextAttemptId = makeAttemptId,
): LearningApplication {
  let state: LearningApplicationState = { status: 'idle', userId: null, profile: null, progress: null, submittingOnboarding: false, error: null, saves: {} };
  let backend: LearningBackend | null = null;
  let booting: Promise<void> | null = null;
  let onboarding: Promise<boolean> | null = null;
  const pendingSaves = new Map<string, Promise<SaveOutcome | null>>();
  const quests = new Map<string, LearningQuestHandle>();
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<LearningApplicationState>) => {
    state = { ...state, ...patch };
    listeners.forEach(listener => listener());
  };
  const saveState = (id: string, save: QuestSaveState) => publish({ saves: { ...state.saves, [id]: save } });
  function adoptProgress(progress: UserProgress) {
    if (state.progress && (state.progress.userId !== progress.userId || state.progress.campaignId !== progress.campaignId)) return;
    if (!state.progress || progress.revision >= state.progress.revision) publish({ progress });
  }
  function bootstrap(): Promise<void> {
    if (booting) return booting;
    if (state.status === 'ready' || state.submittingOnboarding) return Promise.resolve();
    publish({ status: 'loading', error: null });
    booting = (async () => {
      try {
        backend = await connect();
        const rawProfile = await backend.readProfile();
        const profile = rawProfile ? validateOnboarding(rawProfile, content) : null;
        const progress = profile ? await backend.learningService.readProgress({ userId: backend.userId, campaignId: profile.campaignId }) : null;
        publish({ userId: backend.userId, profile, progress, status: progress ? 'ready' : 'needs_onboarding', error: null });
      } catch (error) { publish({ status: 'error', error: message(error) }); }
    })().finally(() => { booting = null; });
    return booting;
  }
  function submitOnboarding(input: OnboardingProfile): Promise<boolean> {
    if (onboarding) return onboarding;
    if (!backend || state.status !== 'needs_onboarding') return Promise.resolve(false);
    const activeBackend = backend;
    publish({ submittingOnboarding: true, error: null });
    onboarding = (async () => {
      try {
        const profile = validateOnboarding(input, content);
        const progress = await activeBackend.learningService.initializeProgress({ userId: activeBackend.userId, campaignId: profile.campaignId }, profile);
        // Mark onboarding complete only after initialization succeeds. A failure here is retryable.
        await activeBackend.saveProfile(profile);
        publish({ status: 'ready', profile, progress, error: null });
        return true;
      } catch (error) { publish({ error: message(error) }); return false; }
      finally { publish({ submittingOnboarding: false }); }
    })().finally(() => { onboarding = null; });
    return onboarding;
  }
  async function refresh() {
    if (!backend || !state.profile || state.status !== 'ready') return bootstrap();
    const key = { userId: backend.userId, campaignId: state.profile.campaignId };
    try {
      const progress = await backend.learningService.readProgress(key);
      if (!progress) throw new Error('Saved progress was not found.');
      adoptProgress(progress);
      publish({ error: null });
    } catch (error) { publish({ error: message(error) }); }
  }
  function getQuest(nodeId: string): LearningQuestHandle | null {
    if (state.status !== 'ready' || !state.progress) return null;
    const campaign = content.campaigns.find(item => item.id === state.progress!.campaignId);
    if (!campaign) return null;
    const node = getCampaignProgress(campaign, toProgressSnapshot(state.progress)).nodes.find(item => item.id === nodeId);
    if (!node || node.status === 'locked') return null;
    let handle = quests.get(nodeId);
    if (!handle) {
      handle = { attemptId: nextAttemptId(), controller: createQuestController(content, campaign.id, nodeId) };
      quests.set(nodeId, handle);
    }
    return handle;
  }
  function saveQuest(handle: LearningQuestHandle): Promise<SaveOutcome | null> {
    const pending = pendingSaves.get(handle.attemptId);
    if (pending) return pending;
    const saved = state.saves[handle.attemptId];
    if (saved?.status === 'saved') return Promise.resolve(saved.outcome);
    const result = handle.controller.getSnapshot().result;
    if (!backend || state.status !== 'ready' || !result || quests.get(result.nodeId) !== handle) return Promise.resolve(null);
    const activeBackend = backend;
    saveState(handle.attemptId, { status: 'saving', outcome: null, error: null });
    const saving = (async () => {
      try {
        const outcome = await activeBackend.learningService.saveAttempt(
          { userId: activeBackend.userId, campaignId: result.campaignId }, handle.attemptId, result,
        );
        adoptProgress(outcome.progress);
        saveState(handle.attemptId, { status: 'saved', outcome, error: null });
        return outcome;
      } catch (error) {
        saveState(handle.attemptId, { status: 'error', outcome: null, error: message(error) });
        return null;
      }
    })().finally(() => { pendingSaves.delete(handle.attemptId); });
    pendingSaves.set(handle.attemptId, saving);
    return saving;
  }
  return { content, getSnapshot: () => state, subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, bootstrap, submitOnboarding, refresh, getQuest, saveQuest };
}
