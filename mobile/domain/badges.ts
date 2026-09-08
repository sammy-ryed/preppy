import type { ContentCatalog } from '../types/content';
import type { UserProgress } from '../types/progress';

export const badgeDefinitions = [
  { id: 'first-solved', title: 'First solved', nickname: 'First Spark!', hint: 'Complete and save your first learning node.' },
  { id: 'zero-mistakes', title: 'Zero mistakes', nickname: 'Flawless!', hint: 'Complete a node with every aptitude and DSA quiz answer correct. Hints are allowed.' },
  { id: 'region-1', title: 'Region 1 complete', nickname: 'Region Explorer!', hint: 'Finish nodes 1–5 and win the first game. Skipping does not earn this badge.' },
  { id: 'region-2', title: 'Region 2 complete', nickname: 'Cloud Chaser!', hint: 'Finish nodes 6–10 and win the second game. Skipping does not earn this badge.' },
  { id: 'region-3', title: 'Region 3 complete', nickname: 'Frost Hound!', hint: 'Finish nodes 11–15 and win the boss fight. Skipping does not earn this badge.' },
] as const;
export type BadgeId = typeof badgeDefinitions[number]['id'];

// Saved receipts and checkpoint outcomes are the source of truth, including after a restart.
// Weighted scores include time/hints, so a score of 100 is not the no-mistakes rule.
export function getBadges(progress: UserProgress | null, content: ContentCatalog) {
  const campaign = content.campaigns.find(item => item.id === progress?.campaignId);
  const receipts = campaign?.nodes.flatMap(node => {
    const receipt = progress?.nodeResults[node.id];
    return receipt?.persistence === 'saved' && receipt.campaignId === campaign.id ? [receipt] : [];
  }) ?? [];
  const flawless = receipts.some(receipt => {
    const quest = content.quests.find(item => item.id === receipt.questId);
    if (!quest?.sections?.some(section => section.subject === 'aptitude') || !quest.sections.some(section => section.subject === 'dsa')) return false;
    const ids = quest.questionIds;
    return ids.length > 0 && receipt.answers.length === ids.length && new Set(receipt.answers.map(answer => answer.questionId)).size === ids.length
      && ids.every(id => receipt.answers.some(answer => answer.questionId === id && answer.correct));
  });
  const earned = [receipts.length > 0, flawless, ...(['break1', 'break2', 'finalBoss'] as const).map(stage => {
    const checkpoint = campaign?.checkpoints.find(item => item.stage === stage);
    return Boolean(checkpoint && progress?.checkpoints.some(item => item.checkpointId === checkpoint.id && item.status === 'completed'));
  })];
  return badgeDefinitions.map((badge, index) => ({ ...badge, earned: earned[index] ?? false }));
}
