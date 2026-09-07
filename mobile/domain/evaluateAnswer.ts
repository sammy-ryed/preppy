import type { Question } from '../types/content';
import type { AnswerSubmission, EvaluatedAnswer } from '../types/learning';

export function evaluateAnswer(question: Question, answer: AnswerSubmission): EvaluatedAnswer {
  if (answer.questionId !== question.id) throw new Error('Question ID mismatch');
  if (!question.options.some(option => option.id === answer.selectedOptionId)) {
    throw new Error(`Unknown option for ${question.id}`);
  }
  if (typeof answer.hintUsed !== 'boolean') throw new Error('hintUsed must be boolean');
  if (answer.activeSeconds !== null && (!Number.isFinite(answer.activeSeconds) || answer.activeSeconds <= 0)) {
    throw new Error('activeSeconds must be positive and finite, or null');
  }
  const correct = answer.selectedOptionId === question.correctOptionId;
  return {
    ...answer,
    skillId: question.skillId,
    evidence: question.evidence,
    correct,
    correctOptionId: question.correctOptionId,
    explanation: question.explanation,
    selectedAnswerFeedback: correct ? question.explanation
      : question.distractorFeedback?.[answer.selectedOptionId] ?? question.explanation,
    expectedSeconds: question.expectedSeconds ?? null,
    event: correct ? 'success' : 'failure',
  };
}

// Duplicate IDs are rejected, not silently scored as extra evidence or corrected retries.
export function evaluateAttempt(
  questions: readonly Question[], answers: readonly AnswerSubmission[],
): EvaluatedAnswer[] {
  if (!questions.length || new Set(questions.map(q => q.id)).size !== questions.length) {
    throw new Error('An attempt needs unique questions');
  }
  const byId = new Map(answers.map(answer => [answer.questionId, answer]));
  if (byId.size !== answers.length || answers.length !== questions.length) {
    throw new Error('Exactly one first response is required per question');
  }
  return questions.map(question => {
    const answer = byId.get(question.id);
    if (!answer) throw new Error(`Missing response for ${question.id}`);
    return evaluateAnswer(question, answer);
  });
}
