import type { ContentCatalog } from './content';
import type { OnboardingLevels, SaveOutcome, UserProgress } from './progress';
import type { QuestController } from './questSession';
import type { createLearningService } from '../services/learningService';

export interface OnboardingProfile extends OnboardingLevels {
  readonly name: string;
  readonly campaignId: string;
}

export interface LearningBackend {
  readonly userId: string;
  readonly learningService: ReturnType<typeof createLearningService>;
  readonly readProfile: () => Promise<OnboardingProfile | null>;
  readonly saveProfile: (profile: OnboardingProfile) => Promise<void>;
}

export interface QuestSaveState {
  readonly status: 'idle' | 'saving' | 'saved' | 'error';
  readonly outcome: SaveOutcome | null;
  readonly error: string | null;
}

export interface LearningApplicationState {
  readonly status: 'idle' | 'loading' | 'needs_onboarding' | 'ready' | 'error';
  readonly userId: string | null;
  readonly profile: OnboardingProfile | null;
  readonly progress: UserProgress | null;
  readonly submittingOnboarding: boolean;
  readonly error: string | null;
  readonly saves: Readonly<Record<string, QuestSaveState>>;
}

export interface LearningQuestHandle {
  readonly attemptId: string;
  readonly controller: QuestController;
}

export interface LearningApplication {
  readonly content: ContentCatalog;
  readonly getSnapshot: () => LearningApplicationState;
  readonly subscribe: (listener: () => void) => () => void;
  readonly bootstrap: () => Promise<void>;
  readonly submitOnboarding: (profile: OnboardingProfile) => Promise<boolean>;
  readonly refresh: () => Promise<void>;
  readonly selectCampaign: (campaignId: string) => Promise<boolean>;
  readonly getQuest: (nodeId: string) => LearningQuestHandle | null;
  readonly saveQuest: (handle: LearningQuestHandle) => Promise<SaveOutcome | null>;
}
