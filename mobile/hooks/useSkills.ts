import type { SkillId } from '../types/content';
import { useLearningApplication } from '../providers/LearningProvider';

const labels: Record<SkillId, string> = {
  arrays: 'Arrays', binary_search: 'Binary Search', sorting: 'Sorting',
  two_pointers: 'Two Pointers', sliding_window: 'Sliding Window', hash_maps: 'Hash Maps',
  stacks: 'Stacks', graphs: 'Graphs', linked_lists: 'Linked Lists', backtracking: 'Backtracking',
  trees: 'Trees', dynamic_programming: 'Dynamic Programming',
  quantitative_aptitude: 'Quantitative Aptitude', logical_reasoning: 'Logical Reasoning',
};

export function useSkills() {
  const { application, state } = useLearningApplication();
  return {
    skills: Object.entries(state.progress?.skills ?? {}).map(([id, skill]) => ({ id, label: labels[id as SkillId] ?? id, ...skill })),
    loading: state.status === 'idle' || state.status === 'loading',
    error: state.error, retry: application.refresh,
  };
}
