import type { SelfAssessedLevel, SkillId } from './content';
import type { ProgressSnapshot, SkillEstimate } from './learning';
import type { QuestAttemptResult } from './questSession';

export interface ProgressKey { readonly userId: string; readonly campaignId: string }
export interface OnboardingLevels { readonly dsaLevel: SelfAssessedLevel; readonly aptitudeLevel: SelfAssessedLevel }

export interface CompletionReceipt extends Omit<QuestAttemptResult, 'persistence'> {
  readonly attemptId: string;
  readonly completedAt: string;
  readonly xpEarned: number;
  readonly skillChanges: readonly { readonly skillId: SkillId; readonly before: SkillEstimate; readonly after: SkillEstimate }[];
  readonly unlockedNodeIds: readonly string[];
  readonly unlockedCheckpointIds: readonly string[];
  readonly persistence: 'saved';
}

export interface UserProgress extends ProgressKey {
  readonly campaignVersion: number;
  readonly revision: number;
  readonly xp: number;
  readonly skills: Readonly<Partial<Record<SkillId, SkillEstimate>>>;
  readonly nodeResults: Readonly<Record<string, CompletionReceipt>>;
  readonly checkpoints: ProgressSnapshot['checkpoints'];
}

export interface SaveOutcome {
  readonly status: 'saved' | 'duplicate' | 'replay';
  readonly receipt: CompletionReceipt;
  readonly progress: UserProgress;
  // Receipt describes the original completion. This is the reward newly applied by this call.
  readonly xpAwardedNow: number;
}

export interface ProgressRepository {
  readonly read: (key: ProgressKey) => Promise<UserProgress | null>;
  readonly initialize: (initial: UserProgress) => Promise<UserProgress>;
  // Must atomically compare revision, save receipt + skills + XP, and deduplicate by node.
  readonly commit: (input: {
    readonly key: ProgressKey;
    readonly campaignVersion: number;
    readonly expectedRevision: number;
    readonly receipt: CompletionReceipt;
    readonly skills: UserProgress['skills'];
  }) => Promise<{ readonly status: 'conflict' } | SaveOutcome>;
}
