import type { ContentCatalog } from '../types/content';
import { starterContent } from './starter';

// Two real quests for the first learning flow, not a finished 15-node campaign.
export const learningContent: ContentCatalog = {
  lessons: [...starterContent.lessons, {
    id: 'arrays-traversal-lesson', title: 'Walking through an array',
    introduction: [
      'Traversal visits each item in order, usually with an index that increases by one.',
      'To sum an array, start a running total at zero and add each visited value.',
      'Stop before the index reaches the array length so every access stays in bounds.',
    ],
    workedExample: {
      prompt: 'Sum [2, 5, 1] by visiting each item once.',
      steps: ['Start with total = 0.', 'At index 0, total becomes 0 + 2 = 2.', 'At index 1, total becomes 2 + 5 = 7.', 'At index 2, total becomes 7 + 1 = 8. Stop before index 3.'],
    },
  }],
  questions: [...starterContent.questions, {
    id: 'traversal-next-process', version: 1, type: 'single_choice',
    skillId: 'arrays', topic: 'traversal', difficulty: 1, evidence: 'process',
    prompt: 'For [4, 7, 3], total is 4 after visiting index 0. Which operation should happen next?',
    options: [{ id: 'add-index', text: 'Add 1 to total' }, { id: 'add-value', text: 'Add 7 to total' }, { id: 'repeat-first', text: 'Add 4 to total again' }],
    correctOptionId: 'add-value', explanation: 'The next index is 1, whose value is 7. Add the value, not the index, to get total = 11.',
    distractorFeedback: { 'add-index': '1 is the next index, but the value at that index is 7.', 'repeat-first': 'Index 0 has already been counted; visit index 1 next.' },
    hint: 'Advance to the next index, then read its value.',
  }, {
    id: 'traversal-loop-process', version: 1, type: 'single_choice',
    skillId: 'arrays', topic: 'traversal', difficulty: 1, evidence: 'process',
    prompt: 'Starting at i = 0 and increasing i by one, which loop condition visits all four items exactly once?',
    options: [{ id: 'less-four', text: 'i < 4' }, { id: 'through-four', text: 'i <= 4' }, { id: 'less-three', text: 'i < 3' }],
    correctOptionId: 'less-four', explanation: 'i < 4 visits indices 0, 1, 2, and 3, then stops before the invalid index 4.',
    distractorFeedback: { 'through-four': 'This also attempts index 4, outside the four-item array.', 'less-three': 'This stops before index 3, missing the last item.' },
    hint: 'There are four indices, beginning at zero.',
  }, {
    id: 'traversal-sum-outcome', version: 1, type: 'single_choice',
    skillId: 'arrays', topic: 'traversal', difficulty: 1, evidence: 'outcome',
    prompt: 'A total starts at 0 and adds every value of [6, 2, 9, 3] exactly once. What is the final total?',
    options: [{ id: 'sum-17', text: '17' }, { id: 'sum-20', text: '20' }, { id: 'sum-6', text: '6' }],
    correctOptionId: 'sum-20', explanation: 'The running totals are 6, 8, 17, and 20. All four values contribute.',
    distractorFeedback: { 'sum-17': '17 is the total before visiting the last value, 3.', 'sum-6': '6 is the sum of indices 0 + 1 + 2 + 3; sum the stored values instead.' },
    hint: 'Keep a running total and include the last value.',
  }],
  quests: [...starterContent.quests, {
    id: 'arrays-traversal', version: 1, lessonId: 'arrays-traversal-lesson',
    questionIds: ['traversal-next-process', 'traversal-loop-process', 'traversal-sum-outcome'],
  }],
  campaigns: starterContent.campaigns.map(campaign => ({
    ...campaign, version: 2, title: 'Array foundations',
    nodes: [...campaign.nodes, {
      id: 'starter:traversal', questId: 'arrays-traversal', title: 'Array traversal',
      order: 2, baseXp: 100,
      prerequisites: [{ type: 'node_completed', nodeId: 'starter:arrays' }],
    }],
  })),
};
