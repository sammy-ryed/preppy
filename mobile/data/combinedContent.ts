import type { ContentCatalog, Question } from '../types/content';
import { learningContent } from './learningContent';

const aptitudeQuestions: readonly Question[] = [{
  id: 'percent-fraction', version: 1, type: 'single_choice', skillId: 'quantitative_aptitude',
  topic: 'percentages', difficulty: 1, evidence: 'process',
  prompt: 'Which expression calculates 15% of 200?',
  options: [{ id: 'multiply', text: '(15 / 100) × 200' }, { id: 'divide', text: '200 / 15' }, { id: 'subtract', text: '200 - 15' }],
  correctOptionId: 'multiply', explanation: 'Percent means per hundred. Multiply the whole by 15/100 to find the part.',
  distractorFeedback: { divide: 'Dividing by 15 does not convert 15 percent to a fraction of the whole.', subtract: 'Subtracting 15 removes a fixed amount, not 15 percent.' },
  hint: 'Convert the percentage to a fraction with denominator 100.',
}, {
  id: 'percent-discount', version: 1, type: 'single_choice', skillId: 'quantitative_aptitude',
  topic: 'percentages', difficulty: 1, evidence: 'process',
  prompt: 'An item costs 500 rupees before a 20% discount. Which method gives the price to pay?',
  options: [{ id: 'remaining', text: '500 × 0.80' }, { id: 'discount-only', text: '500 × 0.20' }, { id: 'fixed', text: '500 - 20' }],
  correctOptionId: 'remaining', explanation: 'After a 20% discount, you pay 80% of the original price: 500 × 0.80 = 400 rupees.',
  distractorFeedback: { 'discount-only': 'This calculates the discount amount, not the price remaining.', fixed: 'The discount is 20 percent of 500, not 20 rupees.' },
  hint: 'Subtract the discount percentage from 100%.',
}, {
  id: 'percent-part', version: 1, type: 'single_choice', skillId: 'quantitative_aptitude',
  topic: 'percentages', difficulty: 1, evidence: 'outcome',
  prompt: 'What is 25% of 240?',
  options: [{ id: '60', text: '60' }, { id: '25', text: '25' }, { id: '180', text: '180' }],
  correctOptionId: '60', explanation: '25% is one quarter. 240 / 4 = 60.',
  distractorFeedback: { '25': '25 is the percentage, not the quantity represented by that percentage.', '180': '180 is what remains after subtracting 25%; the question asks for the 25% part.' },
  hint: '25 out of 100 is the same fraction as 1 out of 4.',
}];
const dsa = learningContent.quests.find(quest => quest.id === 'arrays-traversal')!;

// Opt-in domain catalog only. Do not add to the active provider before section UI exists.
export const combinedContent: ContentCatalog = {
  lessons: [...learningContent.lessons, {
    id: 'percentages-lesson', title: 'Percentages: finding a part of a whole',
    introduction: ['A percentage describes a quantity per hundred.',
      'To find p% of a whole, multiply the whole by p / 100.',
      'For a discount, subtract the discount amount from the original price.'],
    workedExample: { prompt: 'A 300-rupee book has a 10% discount. Find the price to pay.',
      steps: ['Convert 10% to 10 / 100 = 0.10.', 'Discount = 300 × 0.10 = 30 rupees.', 'Price to pay = 300 - 30 = 270 rupees.'] },
  }],
  questions: [...aptitudeQuestions, ...learningContent.questions.filter(question => dsa.questionIds.includes(question.id))],
  quests: [{ id: 'percentages-and-arrays', version: 1, lessonId: 'percentages-lesson',
    questionIds: [...aptitudeQuestions.map(question => question.id), ...dsa.questionIds],
    sections: [
      { subject: 'aptitude', skillId: 'quantitative_aptitude', lessonId: 'percentages-lesson', questionIds: aptitudeQuestions.map(question => question.id) },
      { subject: 'dsa', skillId: 'arrays', lessonId: dsa.lessonId, questionIds: dsa.questionIds,
        visualization: { type: 'array_traversal', values: [2, 5, 1] } },
    ],
  }],
  campaigns: [{ id: 'combined-demo', version: 1, title: 'Percentages and arrays', companyId: null,
    nodes: [{ id: 'combined-demo:foundations', questId: 'percentages-and-arrays', title: 'Percentages and array traversal',
      order: 1, baseXp: 100, prerequisites: [] }], checkpoints: [],
  }],
};
