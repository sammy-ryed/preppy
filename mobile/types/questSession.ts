import type { Lesson, Question, QuestSection } from './content';
import type { VisualizationStep } from '../domain/visualizations';
import type { EvaluatedAnswer, NodePerformance } from './learning';

export type QuestPhase = 'lesson' | 'visualization' | 'example' | 'question' | 'feedback' | 'result';
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
  readonly sectionPerformances?: readonly {
    readonly subject: QuestSection['subject']; readonly skillId: QuestSection['skillId']; readonly performance: NodePerformance;
  }[];
  readonly answers: readonly EvaluatedAnswer[];
  readonly persistence: 'not_saved';
}

export interface QuestSessionView {
  readonly revision: number;
  readonly phase: QuestPhase;
  readonly nodeId: string;
  readonly title: string;
  readonly section: { readonly subject: QuestSection['subject']; readonly number: number; readonly count: number;
    readonly questionCount: number; readonly answeredCount: number } | null;
  readonly visualization: (VisualizationStep & {
    readonly step: number; readonly stepCount: number; readonly canContinue: boolean;
  }) | null;
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
  | { readonly type: 'visualization_next' | 'visualization_previous' | 'visualization_reset' }
  | { readonly type: 'answer'; readonly questionId: string; readonly selectedOptionId: string }
);

export interface QuestController {
  readonly getSnapshot: () => QuestSessionView;
  readonly subscribe: (listener: () => void) => () => void;
  readonly dispatch: (action: QuestAction) => void;
}
