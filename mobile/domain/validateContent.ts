import type { ContentCatalog, Requirement } from '../types/content';

// Validate authored content at startup/in tests, not in individual UI components.
export function validateContent(content: ContentCatalog): string[] {
  const errors: string[] = [];
  const check = (condition: boolean, message: string) => { if (!condition) errors.push(message); };
  const uniqueIds = (items: readonly { readonly id: string }[], label: string) => {
    const seen = new Set<string>();
    for (const item of items) {
      check(item.id.trim().length > 0, `${label}: empty ID`);
      check(!seen.has(item.id), `${label}: duplicate ID ${item.id}`);
      seen.add(item.id);
    }
  };
  uniqueIds(content.questions, 'Questions');
  uniqueIds(content.lessons, 'Lessons');
  uniqueIds(content.quests, 'Quests');
  uniqueIds(content.campaigns, 'Campaigns');
  const questionMap = new Map(content.questions.map(question => [question.id, question]));
  const lessonIds = new Set(content.lessons.map(lesson => lesson.id));
  const questIds = new Set(content.quests.map(quest => quest.id));
  for (const question of content.questions) {
    uniqueIds(question.options, question.id);
    check(Number.isSafeInteger(question.version) && question.version > 0, `${question.id}: invalid version`);
    check(question.options.length >= 2, `${question.id}: needs at least two choices`);
    check(question.options.some(option => option.id === question.correctOptionId), `${question.id}: missing correct option`);
    check(Boolean(question.prompt.trim() && question.explanation.trim()), `${question.id}: needs prompt and explanation`);
    check(question.options.every(option => Boolean(option.text.trim())), `${question.id}: empty choice text`);
    check(question.expectedSeconds === undefined || (Number.isFinite(question.expectedSeconds) && question.expectedSeconds > 0), `${question.id}: invalid expected time`);
    for (const [optionId, feedback] of Object.entries(question.distractorFeedback ?? {})) {
      check(optionId !== question.correctOptionId && question.options.some(option => option.id === optionId), `${question.id}: invalid distractor ${optionId}`);
      check(Boolean(feedback.trim()), `${question.id}: empty distractor explanation`);
    }
  }
  for (const lesson of content.lessons) {
    check(Boolean(lesson.title.trim()) && lesson.introduction.length > 0 && lesson.introduction.every(text => Boolean(text.trim())), `${lesson.id}: empty lesson`);
    check(Boolean(lesson.workedExample.prompt.trim()) && lesson.workedExample.steps.length > 0
      && lesson.workedExample.steps.every(text => Boolean(text.trim())), `${lesson.id}: empty worked example`);
  }
  for (const quest of content.quests) {
    check(Number.isSafeInteger(quest.version) && quest.version > 0, `${quest.id}: invalid version`);
    check(lessonIds.has(quest.lessonId), `${quest.id}: unknown lesson ${quest.lessonId}`);
    check(quest.questionIds.length > 0 && new Set(quest.questionIds).size === quest.questionIds.length, `${quest.id}: needs unique question references`);
    const questions = quest.questionIds.flatMap(id => {
      const question = questionMap.get(id);
      check(Boolean(question), `${quest.id}: unknown question ${id}`);
      return question ? [question] : [];
    });
    // Each scored skill needs its own reasoning and outcome evidence.
    for (const skill of new Set(questions.map(question => question.skillId))) {
      check(questions.filter(q => q.skillId === skill && q.evidence === 'process').length >= 2
        && questions.some(q => q.skillId === skill && q.evidence === 'outcome'), `${quest.id}: insufficient process/outcome evidence for ${skill}`);
    }
  }
  for (const campaign of content.campaigns) {
    uniqueIds(campaign.nodes, campaign.id);
    uniqueIds(campaign.checkpoints, campaign.id);
    check(Number.isSafeInteger(campaign.version) && campaign.version > 0, `${campaign.id}: invalid version`);
    check(campaign.nodes.length > 0, `${campaign.id}: empty campaign`);
    check(new Set(campaign.nodes.map(node => node.order)).size === campaign.nodes.length, `${campaign.id}: duplicate node order`);
    for (const node of campaign.nodes) {
      check(questIds.has(node.questId), `${node.id}: unknown quest ${node.questId}`);
      check(Number.isSafeInteger(node.order) && node.order > 0, `${node.id}: invalid order`);
      check(Number.isSafeInteger(node.baseXp) && node.baseXp >= 0 && node.baseXp <= Number.MAX_SAFE_INTEGER - 50, `${node.id}: invalid XP`);
    }
    const key = (requirement: Requirement) => requirement.type === 'node_completed'
      ? `node:${requirement.nodeId}` : `checkpoint:${requirement.checkpointId}`;
    const graph = new Map<string, readonly Requirement[]>([
      ...campaign.nodes.map(node => [`node:${node.id}`, node.prerequisites] as const),
      ...campaign.checkpoints.map(checkpoint => [`checkpoint:${checkpoint.id}`, checkpoint.prerequisites] as const),
    ]);
    const visiting = new Set<string>();
    const visited = new Set<string>();
    const visit = (id: string) => {
      if (visiting.has(id)) { errors.push(`${campaign.id}: prerequisite cycle at ${id}`); return; }
      if (visited.has(id)) return;
      visiting.add(id);
      for (const requirement of graph.get(id) ?? []) {
        const dependency = key(requirement);
        if (!graph.has(dependency)) errors.push(`${campaign.id}: unknown prerequisite ${dependency}`);
        else visit(dependency);
      }
      visiting.delete(id);
      visited.add(id);
    };
    for (const id of graph.keys()) visit(id);
  }
  return errors;
}
