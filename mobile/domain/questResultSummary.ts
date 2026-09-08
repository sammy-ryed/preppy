import type { QuestAttemptResult } from '../types/questSession';
import type { SaveOutcome } from '../types/progress';

export function questResultSummary(attempt: QuestAttemptResult | null, outcome: SaveOutcome | null) {
  const result = attempt ?? outcome?.receipt ?? null;
  if (!result) return null;
  const replay = outcome?.status === 'replay';
  return {
    result, replay, saved: Boolean(outcome), xpAwarded: outcome?.xpAwardedNow ?? 0,
    correctCount: result.answers.filter(answer => answer.correct).length,
    questionCount: result.answers.length,
    // Replays return the first receipt from the backend. Do not present its old
    // score or old skill deltas as newly achieved by the current attempt.
    skillChanges: outcome && !replay ? outcome.receipt.skillChanges : [],
    sections: result.sectionPerformances?.map(section => ({ ...section,
      correctCount: result.answers.filter(answer => answer.skillId === section.skillId && answer.correct).length,
      questionCount: result.answers.filter(answer => answer.skillId === section.skillId).length,
    })) ?? [],
    untimed: result.answers.filter(answer => answer.evidence === 'outcome').every(answer => answer.activeSeconds === null || answer.expectedSeconds === null),
  };
}
