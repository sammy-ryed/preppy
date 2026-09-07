export const DSA_SKILL_IDS = ['arrays', 'binary_search', 'sorting', 'two_pointers', 'sliding_window',
  'hash_maps', 'stacks', 'graphs', 'linked_lists', 'backtracking', 'trees', 'dynamic_programming'] as const;
export const APTITUDE_SKILL_IDS = ['quantitative_aptitude', 'logical_reasoning'] as const;
export type SkillId = typeof DSA_SKILL_IDS[number] | typeof APTITUDE_SKILL_IDS[number];

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
  // Absent for legacy quests. Combined quests retain flattened references for saves.
  readonly sections?: readonly QuestSection[];
}

export interface QuestSection {
  readonly subject: 'aptitude' | 'dsa';
  readonly skillId: SkillId;
  readonly lessonId: string;
  readonly questionIds: readonly string[];
  readonly visualization?: Visualization;
}

export type Visualization =
  | { readonly type: 'array_traversal' | 'prefix_sums' | 'bubble_sort' | 'frequency_count' | 'linked_list_reverse' | 'subsets'; readonly values: readonly number[] }
  | { readonly type: 'linear_search' | 'binary_search' | 'two_pointers' | 'bst_search'; readonly values: readonly number[]; readonly target: number }
  | { readonly type: 'sliding_window'; readonly values: readonly number[]; readonly width: number }
  | { readonly type: 'brackets'; readonly text: string }
  | { readonly type: 'bfs'; readonly edges: readonly (readonly number[])[]; readonly start: number; readonly target: number }
  | { readonly type: 'min_coins'; readonly values: readonly number[]; readonly amount: number };

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
