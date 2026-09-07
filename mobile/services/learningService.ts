import type { Campaign, ContentCatalog, SkillId } from '../types/content';
import type { ProgressSnapshot } from '../types/learning';
import type { CompletionReceipt, OnboardingLevels, ProgressKey, ProgressRepository, SaveOutcome, UserProgress } from '../types/progress';
import type { QuestAttemptResult } from '../types/questSession';
import { evaluateAttempt } from '../domain/evaluateAnswer';
import { getCampaignProgress } from '../domain/progression';
import { calculateNodePerformance, calculateXP, seedMastery, updateMastery } from '../domain/scoring';
import { validateContent } from '../domain/validateContent';

export function toProgressSnapshot(progress: UserProgress): ProgressSnapshot {
  return { campaignId: progress.campaignId, campaignVersion: progress.campaignVersion,
    completedNodeIds: Object.keys(progress.nodeResults), checkpoints: progress.checkpoints };
}

export function createLearningService(content: ContentCatalog, repository: ProgressRepository, now = () => new Date()) {
  const issues = validateContent(content);
  if (issues.length) throw new Error(`Invalid learning content: ${issues.join('; ')}`);
  function campaignFor(key: ProgressKey): Campaign {
    if (!key.userId.trim()) throw new Error('An authenticated user is required');
    const campaign = content.campaigns.find(item => item.id === key.campaignId);
    if (!campaign) throw new Error('Unknown campaign');
    return campaign;
  }
  function verify(progress: UserProgress, key: ProgressKey, campaign: Campaign) {
    if (progress.userId !== key.userId || progress.campaignId !== key.campaignId
      || progress.campaignVersion !== campaign.version) throw new Error('Progress identity/version mismatch');
    if (!Number.isSafeInteger(progress.xp) || progress.xp < 0
      || !Number.isSafeInteger(progress.revision) || progress.revision < 0) throw new Error('Invalid progress totals');
    getCampaignProgress(campaign, toProgressSnapshot(progress));
    return progress;
  }
  async function readProgress(key: ProgressKey) {
    const campaign = campaignFor(key);
    const progress = await repository.read(key);
    return progress ? verify(progress, key, campaign) : null;
  }
  async function initializeProgress(key: ProgressKey, levels: OnboardingLevels) {
    const campaign = campaignFor(key);
    const skills: Partial<Record<SkillId, ReturnType<typeof seedMastery>>> = {};
    for (const skillId of new Set(content.questions.map(question => question.skillId))) {
      skills[skillId] = seedMastery(skillId === 'quantitative_aptitude' || skillId === 'logical_reasoning' ? levels.aptitudeLevel : levels.dsaLevel);
    }
    const progress = await repository.initialize({ ...key, campaignVersion: campaign.version, revision: 0, xp: 0, skills, nodeResults: {}, checkpoints: [] });
    return verify(progress, key, campaign);
  }
  async function saveAttempt(key: ProgressKey, attemptId: string, attempt: QuestAttemptResult): Promise<SaveOutcome> {
    const campaign = campaignFor(key);
    if (!attemptId.trim() || attemptId.length > 128) throw new Error('A stable attempt ID is required');
    if (attempt.campaignId !== campaign.id || attempt.campaignVersion !== campaign.version) throw new Error('Attempt campaign version mismatch');
    const node = campaign.nodes.find(item => item.id === attempt.nodeId);
    if (!node) throw new Error('Unknown node');
    const quest = content.quests.find(item => item.id === node.questId)!;
    const questions = quest.questionIds.map(id => content.questions.find(item => item.id === id)!);
    if (quest.id !== attempt.questId || quest.version !== attempt.questVersion
      || Object.keys(attempt.questionVersions).length !== questions.length
      || questions.some(question => attempt.questionVersions[question.id] !== question.version)) throw new Error('Attempt content version mismatch');
    // Strip all supplied grading fields; evaluate against the versioned local answer keys again.
    const answers = evaluateAttempt(questions, attempt.answers.map(answer => ({
      questionId: answer.questionId, selectedOptionId: answer.selectedOptionId,
      hintUsed: answer.hintUsed, activeSeconds: answer.activeSeconds,
    })));
    const performance = calculateNodePerformance(answers);
    for (let retry = 0; retry < 3; retry += 1) {
      const progress = await readProgress(key);
      if (!progress) throw new Error('Initialize onboarding progress before saving a quest');
      if (Object.values(progress.nodeResults).some(result => result.attemptId === attemptId && result.nodeId !== node.id)) throw new Error('Attempt ID was already used for another node');
      const existing = Object.hasOwn(progress.nodeResults, node.id) ? progress.nodeResults[node.id] : undefined;
      if (existing) return { status: existing.attemptId === attemptId ? 'duplicate' : 'replay', receipt: existing, progress, xpAwardedNow: 0 };
      const before = getCampaignProgress(campaign, toProgressSnapshot(progress));
      if (before.nodes.find(item => item.id === node.id)?.status !== 'available') throw new Error('This node is locked');
      const skills = { ...progress.skills };
      const skillChanges: CompletionReceipt['skillChanges'][number][] = [];
      for (const skillId of new Set(answers.map(answer => answer.skillId))) {
        const previous = skills[skillId];
        if (!previous) throw new Error(`Missing onboarding estimate for ${skillId}`);
        const after = updateMastery(previous, skillId, answers, { isReplay: false });
        skills[skillId] = after;
        skillChanges.push({ skillId, before: previous, after });
      }
      const after = getCampaignProgress(campaign, { ...toProgressSnapshot(progress), completedNodeIds: [...Object.keys(progress.nodeResults), node.id] });
      const xpEarned = calculateXP(node.baseXp, performance.accuracy, { isReplay: false });
      if (!Number.isSafeInteger(progress.xp + xpEarned)) throw new Error('XP total exceeds the supported range');
      const receipt: CompletionReceipt = {
        campaignId: campaign.id, campaignVersion: campaign.version, nodeId: node.id,
        questId: quest.id, questVersion: quest.version,
        questionVersions: Object.fromEntries(questions.map(question => [question.id, question.version])),
        answers, performance, persistence: 'saved', attemptId, completedAt: now().toISOString(), xpEarned, skillChanges,
        unlockedNodeIds: after.nodes.filter(item => item.status === 'available' && before.nodes.find(previous => previous.id === item.id)?.status === 'locked').map(item => item.id),
        unlockedCheckpointIds: after.checkpoints.filter(item => item.status === 'available' && before.checkpoints.find(previous => previous.id === item.id)?.status === 'locked').map(item => item.id),
      };
      const committed = await repository.commit({ key, campaignVersion: campaign.version, expectedRevision: progress.revision, receipt, skills });
      if (committed.status !== 'conflict') {
        verify(committed.progress, key, campaign);
        return committed;
      }
    }
    throw new Error('Progress changed repeatedly. Retry this same attempt.');
  }
  return { readProgress, initializeProgress, saveAttempt };
}
