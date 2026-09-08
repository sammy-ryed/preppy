const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getBadges, getUnseenBadges } = require('../.domain-test/domain/badges.js');
const { curriculumContent: content } = require('../.domain-test/data/curriculum/index.js');
const campaign = content.campaigns[0];
const node = campaign.nodes[0];
const quest = content.quests.find(item => item.id === node.questId);
const receipt = () => ({ persistence: 'saved', attemptId: 'first-run-attempt', completedAt: '2026-09-08T10:00:00.000Z', campaignId: campaign.id, nodeId: node.id, questId: quest.id,
  performance: { score: 80 }, answers: quest.questionIds.map(questionId => ({ questionId, correct: true, hintUsed: true })) });
const progress = () => ({ campaignId: campaign.id, nodeResults: {}, checkpoints: [] });
const earned = value => getBadges(value, content).filter(badge => badge.earned).map(badge => badge.id);

test('all five badges start locked, and a saved perfect node earns the first two together regardless of timing/hints', () => {
  assert.equal(getBadges(null, content).length, 5);
  assert.deepEqual(earned(null), []);
  const state = progress();
  state.nodeResults[node.id] = receipt();
  assert.deepEqual(earned(state), ['first-solved', 'zero-mistakes']);
  assert.deepEqual(earned(JSON.parse(JSON.stringify(state))), earned(state));
});

test('clearing database progress and earning again cannot be suppressed by the previous phone notification history', () => {
  const state = progress(); state.nodeResults[node.id] = receipt();
  const previousBadges = getBadges(state, content);
  const seen = getUnseenBadges(previousBadges, []).map(badge => badge.notificationId);
  assert.deepEqual(getUnseenBadges(previousBadges, seen), []);
  assert.deepEqual(getUnseenBadges(getBadges(progress(), content), seen), []);
  // Same user/campaign, new saved attempt after the database was cleared.
  state.nodeResults[node.id] = { ...receipt(), attemptId: 'fresh-run-attempt', completedAt: '2026-09-08T11:00:00.000Z' };
  const freshBadges = getBadges(state, content);
  assert.deepEqual(getUnseenBadges(freshBadges, seen).map(badge => badge.id), ['first-solved', 'zero-mistakes']);
  const freshSeen = getUnseenBadges(freshBadges, seen).map(badge => badge.notificationId);
  assert.deepEqual(getUnseenBadges(getBadges(JSON.parse(JSON.stringify(state)), content), freshSeen), []);
  // Legacy caches only contain badge IDs; they cannot hide the current saved award.
  assert.equal(getUnseenBadges(freshBadges, ['first-solved', 'zero-mistakes']).length, 2);
});

test('later node completions and game wins do not replay acknowledged badges in the same run', () => {
  const state = progress(); state.nodeResults[node.id] = receipt();
  const seen = getUnseenBadges(getBadges(state, content), []).map(badge => badge.notificationId);
  const second = campaign.nodes[1];
  const secondQuest = content.quests.find(item => item.id === second.questId);
  state.nodeResults[second.id] = { ...receipt(), nodeId: second.id, questId: secondQuest.id,
    attemptId: 'later-attempt', completedAt: '2026-09-08T12:00:00.000Z',
    answers: secondQuest.questionIds.map(questionId => ({ questionId, correct: true })) };
  assert.deepEqual(getUnseenBadges(getBadges(state, content), seen), []);
  state.checkpoints = [{ checkpointId: campaign.checkpoints[0].id, status: 'completed' }];
  assert.deepEqual(getUnseenBadges(getBadges(state, content), seen).map(badge => badge.id), ['region-1']);
});

test('zero mistakes requires every answer from both quizzes, not just accuracy or a partial/duplicate list', () => {
  for (const modify of [
    result => { result.answers[0].correct = false; },
    result => { result.answers.pop(); },
    result => { result.answers[1] = result.answers[0]; },
    result => { result.answers = []; },
    result => { result.answers[0].questionId = 'unrelated'; },
  ]) {
    const result = receipt(); modify(result);
    const state = progress(); state.nodeResults[node.id] = result;
    assert.deepEqual(earned(state), ['first-solved']);
  }
});

test('unsaved results and other campaigns do not earn node badges', () => {
  for (const patch of [{ persistence: 'not_saved' }, { campaignId: 'other-campaign' }]) {
    const state = progress(); state.nodeResults[node.id] = { ...receipt(), ...patch };
    assert.deepEqual(earned(state), []);
  }
});

test('each region requires its own saved game win; skipped, active, cancelled and unrelated games do not qualify', () => {
  const state = progress();
  for (const status of ['skipped', 'active', 'cancelled']) {
    state.checkpoints = campaign.checkpoints.map(item => ({ checkpointId: item.id, status }));
    assert.deepEqual(earned(state), []);
  }
  state.checkpoints = [{ checkpointId: 'unrelated', status: 'completed' }];
  assert.deepEqual(earned(state), []);
  campaign.checkpoints.forEach((checkpoint, index) => {
    state.checkpoints = [{ checkpointId: checkpoint.id, status: 'completed' }];
    assert.deepEqual(earned(state), [`region-${index + 1}`]);
  });
  state.checkpoints = campaign.checkpoints.map(item => ({ checkpointId: item.id, status: 'completed' }));
  assert.deepEqual(earned(state), ['region-1', 'region-2', 'region-3']);
});
