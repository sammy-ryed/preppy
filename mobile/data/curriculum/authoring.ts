import type { SkillId, Visualization } from '../../types/content';

export interface QuizDraft {
  readonly prompt: string;
  readonly answers: readonly [string, string, string]; // Correct answer first in authored source; builder rotates it.
  readonly explanation: string;
  readonly hint: string;
  readonly wrongFeedback: readonly [string, string];
}
export const q = (prompt: string, correct: string, wrong1: string, wrong2: string, explanation: string,
  hint: string, feedback1: string, feedback2: string): QuizDraft =>
  ({ prompt, answers: [correct, wrong1, wrong2], explanation, hint, wrongFeedback: [feedback1, feedback2] });
export interface SectionDraft {
  readonly title: string;
  readonly skillId: SkillId;
  readonly concepts: readonly string[];
  readonly example: readonly [string, ...string[]];
  readonly quiz: readonly [QuizDraft, QuizDraft, QuizDraft];
  readonly visualization?: Visualization;
}
