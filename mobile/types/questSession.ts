import type { Lesson, Question } from './content';
import type { EvaluatedAnswer, NodePerformance } from './learning';

export type QuestPhase = 'lesson' | 'example' | 'question' | 'feedback' | 'result';
export type PresentedQuestion = Pick<Question, 'id' | 'type' | 'prompt' | 'options' | 'skillId' | 'difficulty'> & {
  readonly hasHint: boolean;
};

export interface QuestAttemptResult {
  readonly campaignId: string;
  readonly campaignVersion: number;
  readonly nodeId: string;
  readonly questId: string;
  readonly questVersion: number;
  readonly questionVersions: Readonly<Record<string, number>>;
  readonly performance: NodePerformance;
  readonly answers: readonly EvaluatedAnswer[];
  readonly persistence: 'not_saved';
}

export interface QuestSessionView {
  readonly revision: number;
  readonly phase: QuestPhase;
  readonly nodeId: string;
  readonly title: string;
  readonly lesson: Pick<Lesson, 'title' | 'introduction'> | null;
  readonly example: Lesson['workedExample'] | null;
  readonly question: PresentedQuestion | null;
  readonly hint: string | null;
  readonly feedback: EvaluatedAnswer | null;
  readonly questionNumber: number | null;
  readonly questionCount: number;
  readonly answeredCount: number;
  readonly result: QuestAttemptResult | null;
  readonly error: string | null;
}

export type QuestAction = { readonly revision: number } & (
  | { readonly type: 'next' }
  | { readonly type: 'hint' }
  | { readonly type: 'answer'; readonly questionId: string; readonly selectedOptionId: string }
);

export interface QuestController {
  readonly getSnapshot: () => QuestSessionView;
  readonly subscribe: (listener: () => void) => () => void;
  readonly dispatch: (action: QuestAction) => void;
}
