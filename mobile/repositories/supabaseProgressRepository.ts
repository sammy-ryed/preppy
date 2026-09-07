import type { ProgressRepository, UserProgress } from '../types/progress';

// SupabaseClient satisfies this small boundary; test doubles need no network or SDK.
export interface ProgressRpcClient {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Malformed progress response');
  return value as Record<string, unknown>;
}
function check(condition: boolean): asserts condition {
  if (!condition) throw new Error('Malformed progress response');
}
const text = (value: unknown) => typeof value === 'string' && value.length > 0;
const integer = (value: unknown, min = 0) => typeof value === 'number' && Number.isSafeInteger(value) && value >= min;
const fraction = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
function skill(value: unknown) {
  const item = record(value);
  check(integer(item.mastery) && Number(item.mastery) <= 100 && integer(item.evidenceCount));
}

export function decodeProgress(value: unknown): UserProgress {
  const row = record(value);
  check(text(row.user_id) && text(row.campaign_id) && integer(row.campaign_version, 1) && integer(row.revision) && integer(row.xp));
  const skills = record(row.skills);
  Object.values(skills).forEach(skill);
  const results = record(row.node_results);
  const attemptIds = new Set<string>();
  for (const [nodeId, raw] of Object.entries(results)) {
    const receipt = record(raw);
    check(receipt.nodeId === nodeId && receipt.campaignId === row.campaign_id && receipt.campaignVersion === row.campaign_version);
    check(text(receipt.attemptId) && text(receipt.questId) && integer(receipt.questVersion, 1)
      && integer(receipt.xpEarned) && receipt.persistence === 'saved'
      && typeof receipt.completedAt === 'string' && Number.isFinite(Date.parse(receipt.completedAt)));
    check(!attemptIds.has(String(receipt.attemptId)));
    attemptIds.add(String(receipt.attemptId));
    const performance = record(receipt.performance);
    check(integer(performance.score) && Number(performance.score) <= 100 && integer(performance.scoringVersion, 1)
      && integer(performance.evidenceCount, 1) && fraction(performance.process) && fraction(performance.accuracy) && fraction(performance.time));
    const points = record(performance.points);
    check([points.process, points.accuracy, points.time].every(point => typeof point === 'number' && Number.isFinite(point) && point >= 0 && point <= 100));
    check(Object.values(record(receipt.questionVersions)).every(version => integer(version, 1)));
    check(Array.isArray(receipt.answers) && receipt.answers.length > 0);
    for (const rawAnswer of receipt.answers) {
      const answer = record(rawAnswer);
      check(text(answer.questionId) && text(answer.selectedOptionId) && text(answer.correctOptionId)
        && text(answer.skillId) && typeof answer.correct === 'boolean' && typeof answer.hintUsed === 'boolean'
        && (answer.evidence === 'process' || answer.evidence === 'outcome')
        && (answer.event === 'success' || answer.event === 'failure')
        && text(answer.explanation) && text(answer.selectedAnswerFeedback));
      check([answer.activeSeconds, answer.expectedSeconds].every(seconds => seconds === null || (typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0)));
    }
    check(Array.isArray(receipt.skillChanges));
    for (const rawChange of receipt.skillChanges) {
      const change = record(rawChange);
      check(text(change.skillId)); skill(change.before); skill(change.after);
    }
    check(Array.isArray(receipt.unlockedNodeIds) && receipt.unlockedNodeIds.every(text));
    check(Array.isArray(receipt.unlockedCheckpointIds) && receipt.unlockedCheckpointIds.every(text));
  }
  check(Array.isArray(row.checkpoints));
  for (const raw of row.checkpoints) {
    const checkpoint = record(raw);
    check(text(checkpoint.checkpointId) && ['active', 'cancelled', 'completed', 'skipped'].includes(String(checkpoint.status)));
  }
  return {
    userId: row.user_id, campaignId: row.campaign_id, campaignVersion: row.campaign_version,
    revision: row.revision, xp: row.xp, skills, nodeResults: results, checkpoints: row.checkpoints,
  } as UserProgress;
}

export function createSupabaseProgressRepository(client: ProgressRpcClient): ProgressRepository {
  async function rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await client.rpc(name, args);
    if (error) throw new Error(`Progress request failed: ${error.message}`);
    return data;
  }
  return {
    async read(key) {
      const data = await rpc('preppy_read_progress', { p_user_id: key.userId, p_campaign_id: key.campaignId });
      return data === null ? null : decodeProgress(data);
    },
    async initialize(initial) {
      return decodeProgress(await rpc('preppy_initialize_progress', {
        p_user_id: initial.userId, p_campaign_id: initial.campaignId,
        p_campaign_version: initial.campaignVersion, p_skills: initial.skills,
      }));
    },
    async commit(input) {
      const data = record(await rpc('preppy_commit_node', {
        p_user_id: input.key.userId, p_campaign_id: input.key.campaignId,
        p_campaign_version: input.campaignVersion, p_expected_revision: input.expectedRevision,
        p_receipt: input.receipt, p_skills: input.skills,
      }));
      if (data.status === 'conflict') return { status: 'conflict' };
      check(data.status === 'saved' || data.status === 'duplicate' || data.status === 'replay');
      const progress = decodeProgress(data.progress);
      const receipt = Object.hasOwn(progress.nodeResults, input.receipt.nodeId) ? progress.nodeResults[input.receipt.nodeId] : undefined;
      check(Boolean(receipt));
      return { status: data.status, progress, receipt: receipt!, xpAwardedNow: data.status === 'saved' ? receipt!.xpEarned : 0 };
    },
  };
}
