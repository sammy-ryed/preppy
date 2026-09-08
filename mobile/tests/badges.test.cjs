const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getBadges } = require('../.domain-test/domain/badges.js');
const { curriculumContent: content } = require('../.domain-test/data/curriculum/index.js');
const campaign = content.campaigns[0];
const node = campaign.nodes[0];
const quest = content.quests.find(item => item.id === node.questId);
const receipt = () => ({ persistence: 'saved', campaignId: campaign.id, nodeId: node.id, questId: quest.id,
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
