import type { ContentCatalog, Lesson, Question, Quest } from '../../types/content';
import { aptitude } from './aptitude';
import { dsa } from './dsa';

export const CURRICULUM_ID = 'placement-foundations-v1';
const nodeId = (n: number) => `${CURRICULUM_ID}:node-${String(n).padStart(2, '0')}`;
const lessons: Lesson[] = [];
const questions: Question[] = [];
const quests: Quest[] = [];
if (aptitude.length !== 15 || dsa.length !== 15) throw new Error('The curriculum requires 15 paired sections');

for (let i = 0; i < 15; i++) {
  const id = nodeId(i + 1);
  const sections = [aptitude[i]!, dsa[i]!].map((draft, sectionIndex) => {
    const subject = sectionIndex === 0 ? 'aptitude' as const : 'dsa' as const;
    const lessonId = `${id}:${subject}:lesson`;
    lessons.push({ id: lessonId, title: draft.title, introduction: draft.concepts,
      workedExample: { prompt: draft.example[0], steps: draft.example.slice(1) } });
    const questionIds = draft.quiz.map((item, questionIndex) => {
      const questionId = `${id}:${subject}:q${questionIndex + 1}`;
      const choices = item.answers.map((text, index) => ({ id: `${questionId}:choice-${index}`, text }));
      // Stable rotation distributes correct answers across positions without randomizing saved IDs.
      const offset = (i + sectionIndex + questionIndex) % choices.length;
      questions.push({ id: questionId, version: 1, type: 'single_choice', skillId: draft.skillId,
        topic: draft.title, difficulty: i < 5 ? 1 : i < 10 ? 2 : 3,
        evidence: questionIndex < 2 ? 'process' : 'outcome', prompt: item.prompt,
        options: [...choices.slice(offset), ...choices.slice(0, offset)], correctOptionId: choices[0]!.id,
        explanation: item.explanation, hint: item.hint,
        distractorFeedback: { [choices[1]!.id]: item.wrongFeedback[0], [choices[2]!.id]: item.wrongFeedback[1] },
      });
      return questionId;
    });
    return { subject, skillId: draft.skillId, lessonId, questionIds,
      ...(draft.visualization ? { visualization: draft.visualization } : {}) };
  });
  quests.push({ id: `${id}:quest`, version: 1, lessonId: sections[0]!.lessonId,
    questionIds: sections.flatMap(section => section.questionIds), sections });
}

// Opt-in: no provider or screen uses this catalog until presentation integration.
export const curriculumContent: ContentCatalog = {
  lessons, questions, quests,
  campaigns: [{ id: CURRICULUM_ID, version: 1, title: 'Placement foundations: aptitude and DSA', companyId: null,
    nodes: quests.map((quest, i) => ({ id: nodeId(i + 1), questId: quest.id,
      title: `${aptitude[i]!.title} + ${dsa[i]!.title}`, order: i + 1, baseXp: i < 5 ? 100 : i < 10 ? 125 : 150,
      prerequisites: i === 0 ? [] : [
        { type: 'node_completed' as const, nodeId: nodeId(i) },
        ...(i === 5 || i === 10 ? [{ type: 'checkpoint_resolved' as const, checkpointId: `${CURRICULUM_ID}:break${i / 5}` }] : []),
      ],
    })),
    checkpoints: [5, 10, 15].map((n, i) => ({ id: `${CURRICULUM_ID}:${i === 2 ? 'finalBoss' : `break${i + 1}`}`,
      stage: i === 0 ? 'break1' : i === 1 ? 'break2' : 'finalBoss', canSkip: true,
      prerequisites: [{ type: 'node_completed', nodeId: nodeId(n) }],
    })),
  }],
};
