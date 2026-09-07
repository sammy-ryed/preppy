import type { ContentCatalog } from '../types/content';

// One real, reviewed quest. This is not a complete company campaign.
export const starterContent: ContentCatalog = {
  lessons: [{
    id: 'arrays-indexing-lesson',
    title: 'Finding your place in an array',
    introduction: [
      'An array stores items in order. In these examples, indexing starts at zero.',
      'For an array of length n, valid indices run from 0 to n - 1.',
      'An index is a position, not the value stored at that position.',
    ],
    workedExample: {
      prompt: 'For values = [12, 24, 36], read the second item.',
      steps: [
        'The first item is at index 0, so the second is at index 1.',
        'Read values[1]. Its value is 24.',
        'There are three items, so the last valid index is 2.',
      ],
    },
  }],
  questions: [
    {
      id: 'arrays-position-process', version: 1, type: 'single_choice',
      skillId: 'arrays', topic: 'zero_based_indexing', difficulty: 1, evidence: 'process',
      prompt: 'You need the fourth item of [5, 10, 15, 20, 25]. Which index should you read?',
      options: [{ id: 'index-2', text: '2' }, { id: 'index-3', text: '3' }, { id: 'index-4', text: '4' }],
      correctOptionId: 'index-3',
      explanation: 'Count positions from zero: the first, second, third, and fourth items have indices 0, 1, 2, and 3.',
      distractorFeedback: {
        'index-2': 'Index 2 selects the third item, one position too early.',
        'index-4': 'Index 4 selects the fifth item. Subtract one from the ordinary position.',
      },
      hint: 'The first item uses index 0.',
    },
    {
      id: 'arrays-bounds-process', version: 1, type: 'single_choice',
      skillId: 'arrays', topic: 'array_bounds', difficulty: 1, evidence: 'process',
      prompt: 'An array has length 6. Before reading an integer index i, which check guarantees it is in bounds?',
      options: [
        { id: 'inclusive-six', text: '0 <= i and i <= 6' },
        { id: 'exclusive-six', text: '0 <= i and i < 6' },
        { id: 'one-based', text: '1 <= i and i <= 6' },
      ],
      correctOptionId: 'exclusive-six',
      explanation: 'The six valid indices are 0 through 5. Include zero and exclude the length, 6.',
      distractorFeedback: {
        'inclusive-six': 'This allows index 6, which lies past the last item.',
        'one-based': 'This excludes the valid first index 0 and includes the invalid index 6.',
      },
      hint: 'The last valid index is length minus one.',
    },
    {
      id: 'arrays-read-outcome', version: 1, type: 'single_choice',
      skillId: 'arrays', topic: 'zero_based_indexing', difficulty: 1, evidence: 'outcome',
      prompt: 'For values = [8, 13, 21, 34, 55], what is values[2] + values[4]?',
      options: [{ id: 'sum-47', text: '47' }, { id: 'sum-76', text: '76' }, { id: 'sum-89', text: '89' }],
      correctOptionId: 'sum-76',
      explanation: 'values[2] is 21 and values[4] is 55. Their sum is 76.',
      distractorFeedback: {
        'sum-47': '47 adds the second and fourth items (13 + 34), treating indices as one-based positions.',
        'sum-89': '89 adds indices 3 and 4 (34 + 55). Index 2 is 21, not 34.',
      },
      hint: 'Write indices 0, 1, 2, 3, 4 under the five values.',
      // Intentionally untimed: no arbitrary deadline for the first learning quest.
    },
  ],
  quests: [{
    id: 'arrays-indexing', version: 1, lessonId: 'arrays-indexing-lesson',
    questionIds: ['arrays-position-process', 'arrays-bounds-process', 'arrays-read-outcome'],
  }],
  campaigns: [{
    id: 'starter', version: 1, title: 'Starter learning quest', companyId: null,
    nodes: [{ id: 'starter:arrays', questId: 'arrays-indexing', title: 'Array foundations', order: 1, baseXp: 100, prerequisites: [] }],
    checkpoints: [],
  }],
};
