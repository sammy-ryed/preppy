import type { SelfAssessedLevel, SkillId } from '../types/content';
import type { EvaluatedAnswer, NodePerformance, SkillEstimate } from '../types/learning';

export const SCORING = Object.freeze({ version: 1, process: 0.70, accuracy: 0.20, time: 0.10, newEvidence: 0.30 });
const INITIAL_MASTERY = { beginner: 30, intermediate: 55, advanced: 75 } as const;

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateNodePerformance(answers: readonly EvaluatedAnswer[]): NodePerformance {
  if (new Set(answers.map(answer => answer.questionId)).size !== answers.length) {
    throw new Error('Duplicate scoring evidence');
  }
  const processAnswers = answers.filter(answer => answer.evidence === 'process');
  const outcomeAnswers = answers.filter(answer => answer.evidence === 'outcome');
  if (!processAnswers.length || !outcomeAnswers.length) {
    throw new Error('Both process and outcome evidence are required');
  }
  const process = mean(processAnswers.map(answer => Number(answer.correct)));
  const accuracy = mean(outcomeAnswers.map(answer => Number(answer.correct)));
  const time = mean(outcomeAnswers.map(answer => {
    if (!answer.correct) return 0;
    if (answer.activeSeconds === null || answer.expectedSeconds === null) return 0.5;
    if (!Number.isFinite(answer.activeSeconds) || answer.activeSeconds <= 0
      || !Number.isFinite(answer.expectedSeconds) || answer.expectedSeconds <= 0) {
      throw new Error('Invalid timing evidence');
    }
    return Math.min(1, answer.expectedSeconds / answer.activeSeconds);
  }));
  const points = { process: process * 100 * SCORING.process, accuracy: accuracy * 100 * SCORING.accuracy, time: time * 100 * SCORING.time };
  return { scoringVersion: SCORING.version, score: Math.round(points.process + points.accuracy + points.time), process, accuracy, time, points, evidenceCount: answers.length };
}

export function seedMastery(level: SelfAssessedLevel): SkillEstimate {
  if (!Object.hasOwn(INITIAL_MASTERY, level)) throw new Error('Unknown self-assessed level');
  return { mastery: INITIAL_MASTERY[level], evidenceCount: 0 };
}

export function updateMastery(
  previous: SkillEstimate, skillId: SkillId, answers: readonly EvaluatedAnswer[],
  options: { readonly isReplay: boolean },
): SkillEstimate {
  if (!Number.isFinite(previous.mastery) || previous.mastery < 0 || previous.mastery > 100
    || !Number.isSafeInteger(previous.evidenceCount) || previous.evidenceCount < 0) {
    throw new Error('Invalid previous skill estimate');
  }
  if (options.isReplay) return { ...previous };
  const evidence = answers.filter(answer => answer.skillId === skillId);
  if (evidence.filter(answer => answer.evidence === 'process').length < 2
    || evidence.filter(answer => answer.evidence === 'outcome').length < 1) return { ...previous };
  const performance = calculateNodePerformance(evidence);
  return {
    mastery: Math.round(previous.mastery * (1 - SCORING.newEvidence) + performance.score * SCORING.newEvidence),
    evidenceCount: previous.evidenceCount + evidence.length,
  };
}

export function calculateXP(baseXp: number, accuracy: number, options: { readonly isReplay: boolean }): number {
  if (!Number.isSafeInteger(baseXp) || baseXp < 0 || baseXp > Number.MAX_SAFE_INTEGER - 50) throw new Error('Invalid base XP');
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1) throw new Error('Accuracy must be in [0, 1]');
  return options.isReplay ? 0 : baseXp + Math.round(50 * accuracy);
}
