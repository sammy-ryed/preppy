export type SkillId =
  | 'arrays'
  | 'binary_search'
  | 'sorting'
  | 'quantitative_aptitude'
  | 'logical_reasoning';

export type SelfAssessedLevel = 'beginner' | 'intermediate' | 'advanced';
export type EvidenceKind = 'process' | 'outcome';

export interface Question {
  readonly id: string;
  readonly version: number;
  readonly type: 'single_choice';
  readonly skillId: SkillId;
  readonly topic: string;
  readonly difficulty: 1 | 2 | 3;
  readonly evidence: EvidenceKind;
  readonly prompt: string;
  readonly options: readonly { readonly id: string; readonly text: string }[];
  readonly correctOptionId: string;
  readonly explanation: string;
  readonly distractorFeedback?: Readonly<Record<string, string>>;
  readonly hint?: string;
  readonly expectedSeconds?: number;
}

export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly introduction: readonly string[];
  readonly workedExample: {
    readonly prompt: string;
    readonly steps: readonly string[];
  };
}

export interface Quest {
  readonly id: string;
  readonly version: number;
  readonly lessonId: string;
  readonly questionIds: readonly string[];
}

export type Requirement =
  | { readonly type: 'node_completed'; readonly nodeId: string }
  | { readonly type: 'checkpoint_resolved'; readonly checkpointId: string };

export interface CampaignNode {
  readonly id: string;
  readonly questId: string;
  readonly title: string;
  readonly order: number;
  readonly baseXp: number;
  readonly prerequisites: readonly Requirement[];
}

export interface GameCheckpoint {
  readonly id: string;
  readonly stage: 'break1' | 'break2' | 'finalBoss';
  readonly canSkip: boolean;
  readonly prerequisites: readonly Requirement[];
}

export interface Campaign {
  readonly id: string;
  readonly version: number;
  readonly title: string;
  readonly companyId: string | null;
  readonly nodes: readonly CampaignNode[];
  readonly checkpoints: readonly GameCheckpoint[];
}

export interface ContentCatalog {
  readonly lessons: readonly Lesson[];
  readonly questions: readonly Question[];
  readonly quests: readonly Quest[];
  readonly campaigns: readonly Campaign[];
}
