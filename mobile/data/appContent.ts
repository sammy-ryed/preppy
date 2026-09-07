import { learningContent } from './learningContent';
import { curriculumContent } from './curriculum';
// Keep legacy progress readable; offer the full journey first to new users.
export const appContent = {
  lessons: [...curriculumContent.lessons, ...learningContent.lessons],
  questions: [...curriculumContent.questions, ...learningContent.questions],
  quests: [...curriculumContent.quests, ...learningContent.quests],
  campaigns: [...curriculumContent.campaigns, ...learningContent.campaigns],
};
