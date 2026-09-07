import type { Quest } from '../types/content';
import type { EvaluatedAnswer } from '../types/learning';
import { calculateNodePerformance } from './scoring';

export function sectionPerformances(quest: Quest, answers: readonly EvaluatedAnswer[]) {
  return quest.sections?.map(section => ({
    subject: section.subject, skillId: section.skillId,
    performance: calculateNodePerformance(answers.filter(answer => section.questionIds.includes(answer.questionId))),
  }));
}
