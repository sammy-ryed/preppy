import type { EvidenceKind, SkillId } from './content';

// Capture one response per question before feedback; never trust client-supplied correctness.
export interface AnswerSubmission {
  readonly questionId: string;
  readonly selectedOptionId: string;
  readonly hintUsed: boolean;
  // Challenge time only; null means untimed/unreliable. Reading time is excluded.
  readonly activeSeconds: number | null;
}

export interface EvaluatedAnswer extends AnswerSubmission {
  readonly skillId: SkillId;
  readonly evidence: EvidenceKind;
  readonly correct: boolean;
  readonly correctOptionId: string;
  readonly explanation: string;
  readonly selectedAnswerFeedback: string;
  readonly expectedSeconds: number | null;
  readonly event: 'success' | 'failure';
}

export interface NodePerformance {
  readonly scoringVersion: number;
  readonly score: number;
  readonly process: number;
  readonly accuracy: number;
  readonly time: number;
  readonly points: { readonly process: number; readonly accuracy: number; readonly time: number };
  readonly evidenceCount: number;
}

export interface SkillEstimate {
  readonly mastery: number;
  readonly evidenceCount: number;
}

// A minimal read model, not yet a database schema or completion write API.
export interface ProgressSnapshot {
  readonly campaignId: string;
  readonly campaignVersion: number;
  readonly completedNodeIds: readonly string[];
  readonly checkpoints: readonly {
    readonly checkpointId: string;
    readonly status: 'active' | 'cancelled' | 'completed' | 'skipped';
  }[];
}

export type NodeStatus = 'locked' | 'available' | 'completed';
export type CheckpointStatus = 'locked' | 'available' | 'completed' | 'skipped';
