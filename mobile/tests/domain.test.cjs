const assert = require('node:assert/strict');
const { test } = require('node:test');
const { starterContent } = require('../.domain-test/data/starter.js');
const { evaluateAnswer, evaluateAttempt } = require('../.domain-test/domain/evaluateAnswer.js');
const { calculateNodePerformance, updateMastery, seedMastery, calculateXP, SCORING } = require('../.domain-test/domain/scoring.js');
const { getCampaignProgress } = require('../.domain-test/domain/progression.js');
const { validateContent } = require('../.domain-test/domain/validateContent.js');

const questions = starterContent.questions;
const submit = (question, correct = true, extra = {}) => ({
  questionId: question.id,
  selectedOptionId: correct ? question.correctOptionId : question.options.find(option => option.id !== question.correctOptionId).id,
  hintUsed: false,
  activeSeconds: null,
  ...extra,
});
const evaluated = (correct = true) => evaluateAttempt(questions, questions.map(question => submit(question, correct)));

test('starter content has valid links, answer keys, and independent evidence', () => {
  assert.deepEqual(validateContent(starterContent), []);
  assert.equal(questions.filter(q => q.evidence === 'process').length, 2);
  assert.equal(questions.filter(q => q.evidence === 'outcome').length, 1);
});

test('sample answer keys are independently checked against their mathematics', () => {
  const expectedTexts = ['3', '0 <= i and i < 6', '76'];
  questions.forEach((question, index) => {
    assert.equal(question.options.find(option => option.id === question.correctOptionId).text, expectedTexts[index]);
  });
});

test('answer feedback explains the specific distractor and the correct result', () => {
  const result = evaluateAnswer(questions[2], submit(questions[2], false));
  assert.equal(result.correct, false);
  assert.equal(result.event, 'failure');
  assert.match(result.selectedAnswerFeedback, /one-based/);
  assert.match(result.explanation, /76/);
});

test('answer evaluation rejects a different question and unknown options', () => {
  assert.throws(() => evaluateAnswer(questions[0], submit(questions[1])), /mismatch/);
  assert.throws(() => evaluateAnswer(questions[0], submit(questions[0], true, { selectedOptionId: 'missing' })), /Unknown option/);
});

for (const activeSeconds of [0, -1, NaN, Infinity]) {
  test(`answer evaluation rejects invalid active time ${activeSeconds}`, () => {
    assert.throws(() => evaluateAnswer(questions[0], submit(questions[0], true, { activeSeconds })), /activeSeconds/);
  });
}

test('attempts require exactly one response per question, irrespective of input ordering', () => {
  const answers = questions.map(question => submit(question));
  assert.deepEqual(evaluateAttempt(questions, [...answers].reverse()).map(answer => answer.questionId), questions.map(q => q.id));
  assert.throws(() => evaluateAttempt(questions, answers.slice(1)), /Exactly one/);
  assert.throws(() => evaluateAttempt(questions, [answers[0], answers[0], answers[2]]), /Exactly one/);
  assert.throws(() => evaluateAttempt(questions, [...answers.slice(0, 2), { ...answers[2], questionId: 'other' }]), /Missing response/);
  assert.throws(() => evaluateAttempt([], []), /unique questions/);
});

test('all incorrect responses score zero and untimed all-correct responses score 95', () => {
  assert.equal(calculateNodePerformance(evaluated(false)).score, 0);
  const perfect = calculateNodePerformance(evaluated());
  assert.equal(perfect.score, 95);
  assert.deepEqual(perfect.points, { process: 70, accuracy: 20, time: 5 });
  assert.ok(Math.abs(SCORING.process + SCORING.accuracy + SCORING.time - 1) < Number.EPSILON);
});

test('outcome correctness is not reused in the process bucket', () => {
  const onlyOutcome = evaluateAttempt(questions, questions.map(question => submit(question, question.evidence === 'outcome')));
  assert.equal(calculateNodePerformance(onlyOutcome).score, 25);
  const onlyProcess = evaluateAttempt(questions, questions.map(question => submit(question, question.evidence === 'process')));
  assert.equal(calculateNodePerformance(onlyProcess).score, 70);
});

test('time adds at most ten points, is gated by correctness, and falls back when unreliable', () => {
  const timedQuestions = questions.map(question => ({ ...question, expectedSeconds: 20 }));
  const scoreAt = (seconds, correct = true) => calculateNodePerformance(evaluateAttempt(timedQuestions,
    timedQuestions.map(question => submit(question, correct, { activeSeconds: seconds }))));
  assert.equal(scoreAt(1).score, 100);
  assert.equal(scoreAt(20).score, 100);
  assert.equal(scoreAt(40).score, 95);
  assert.equal(scoreAt(200).score, 91);
  assert.equal(scoreAt(null).score, 95);
  assert.equal(scoreAt(1, false).score, 0);
});

test('duplicate evidence and a missing scoring bucket cannot produce a score', () => {
  const answers = evaluated();
  assert.throws(() => calculateNodePerformance([...answers, answers[0]]), /Duplicate/);
  assert.throws(() => calculateNodePerformance(answers.filter(answer => answer.evidence === 'process')), /Both/);
});

test('all response combinations stay bounded without rewarding hints or difficulty twice', () => {
  for (let mask = 0; mask < 8; mask += 1) {
    const answers = questions.map((question, index) => submit(question, Boolean(mask & (1 << index))));
    const score = calculateNodePerformance(evaluateAttempt(questions, answers)).score;
    assert.ok(score >= 0 && score <= 100);
    const harder = questions.map(question => ({ ...question, difficulty: 3 }));
    assert.equal(calculateNodePerformance(evaluateAttempt(harder, answers.map(answer => ({ ...answer, hintUsed: true })))).score, score);
  }
});

test('onboarding seeds are estimates with zero evidence', () => {
  assert.deepEqual(seedMastery('beginner'), { mastery: 30, evidenceCount: 0 });
  assert.equal(seedMastery('intermediate').mastery, 55);
  assert.equal(seedMastery('advanced').mastery, 75);
  assert.throws(() => seedMastery('expert'), /Unknown/);
  assert.throws(() => seedMastery('__proto__'), /Unknown/);
});

test('mastery updates gradually, only for the assessed skill, without mutating history', () => {
  const previous = Object.freeze({ mastery: 52, evidenceCount: 6 });
  assert.deepEqual(updateMastery(previous, 'arrays', evaluated(), { isReplay: false }), { mastery: 65, evidenceCount: 9 });
  assert.deepEqual(updateMastery(previous, 'arrays', evaluated(false), { isReplay: false }), { mastery: 36, evidenceCount: 9 });
  assert.deepEqual(updateMastery(previous, 'sorting', evaluated(), { isReplay: false }), previous);
  assert.equal(previous.mastery, 52);
});

test('replays and insufficient per-skill evidence do not change mastery', () => {
  const previous = seedMastery('beginner');
  assert.deepEqual(updateMastery(previous, 'arrays', evaluated(), { isReplay: true }), previous);
  assert.deepEqual(updateMastery(previous, 'arrays', evaluated().slice(1), { isReplay: false }), previous);
  const mixed = evaluated().map((answer, index) => ({ ...answer, skillId: index === 0 ? 'sorting' : 'arrays' }));
  assert.deepEqual(updateMastery(previous, 'arrays', mixed, { isReplay: false }), previous);
  assert.throws(() => updateMastery({ mastery: NaN, evidenceCount: 0 }, 'arrays', evaluated(), { isReplay: false }), /Invalid previous/);
});

test('XP is separate from mastery and rewards first completion only', () => {
  assert.equal(calculateXP(100, 0, { isReplay: false }), 100);
  assert.equal(calculateXP(100, 1, { isReplay: false }), 150);
  assert.equal(calculateXP(100, 1, { isReplay: true }), 0);
  assert.throws(() => calculateXP(-1, 1, { isReplay: false }), /Invalid base/);
  assert.throws(() => calculateXP(100, NaN, { isReplay: false }), /Accuracy/);
  assert.throws(() => calculateXP(100, 1.1, { isReplay: false }), /Accuracy/);
});

// Test-only full journey. Reused quest references here are graph fixtures, not shipped content.
function campaignFixture() {
  return {
    id: 'test-campaign', version: 1, title: 'Test journey', companyId: null,
    nodes: Array.from({ length: 15 }, (_, index) => {
      const number = index + 1;
      const prerequisites = number === 1 ? [] : [{ type: 'node_completed', nodeId: `quest-${number - 1}` }];
      if (number === 6 || number === 11) prerequisites.push({ type: 'checkpoint_resolved', checkpointId: `gate-${number - 1}` });
      return { id: `quest-${number}`, order: number, questId: 'arrays-indexing', title: 'Test quest', baseXp: 100, prerequisites };
    }),
    checkpoints: [5, 10, 15].map((number, index) => ({
      id: `gate-${number}`, stage: ['break1', 'break2', 'finalBoss'][index], canSkip: true,
      prerequisites: [{ type: 'node_completed', nodeId: `quest-${number}` }],
    })),
  };
}
const snapshot = (count = 0, checkpoints = []) => ({
  campaignId: 'test-campaign', campaignVersion: 1,
  completedNodeIds: Array.from({ length: count }, (_, index) => `quest-${index + 1}`), checkpoints,
});

test('normal progression derives availability from prerequisites and does not mutate ordering', () => {
  const campaign = campaignFixture();
  campaign.nodes.reverse();
  const before = JSON.stringify(campaign);
  assert.equal(getCampaignProgress(campaign, snapshot()).currentNodeId, 'quest-1');
  const progress = getCampaignProgress(campaign, snapshot(1));
  assert.equal(progress.currentNodeId, 'quest-2');
  assert.equal(progress.nodes[0].status, 'completed');
  assert.equal(progress.nodes[2].status, 'locked');
  assert.equal(JSON.stringify(campaign), before);
});

for (const milestone of [5, 10, 15]) {
  test(`configured checkpoint after quest ${milestone} unlocks at the correct point`, () => {
    const priorGates = [5, 10].filter(number => number < milestone).map(number => ({ checkpointId: `gate-${number}`, status: 'completed' }));
    const progress = getCampaignProgress(campaignFixture(), snapshot(milestone, priorGates));
    assert.equal(progress.checkpoints.find(checkpoint => checkpoint.id === `gate-${milestone}`).status, 'available');
    assert.equal(progress.currentNodeId, null);
    assert.equal(progress.educationCompleted, milestone === 15);
    if (milestone < 15) {
      for (const status of ['completed', 'skipped']) {
        assert.equal(getCampaignProgress(campaignFixture(), snapshot(milestone, [...priorGates, { checkpointId: `gate-${milestone}`, status }])).currentNodeId, `quest-${milestone + 1}`);
      }
    }
  });
}

test('active and cancelled games do not silently skip a checkpoint', () => {
  for (const status of ['active', 'cancelled']) {
    const progress = getCampaignProgress(campaignFixture(), snapshot(5, [{ checkpointId: 'gate-5', status }]));
    assert.equal(progress.currentNodeId, null);
    assert.equal(progress.checkpoints[0].status, 'available');
  }
});

test('checkpoint location is configuration, not hardcoded node-five logic', () => {
  const campaign = campaignFixture();
  campaign.checkpoints = [{ id: 'early-break', stage: 'break1', canSkip: true, prerequisites: [{ type: 'node_completed', nodeId: 'quest-1' }] }];
  campaign.nodes = campaign.nodes.slice(0, 2);
  campaign.nodes[1].prerequisites.push({ type: 'checkpoint_resolved', checkpointId: 'early-break' });
  assert.equal(getCampaignProgress(campaign, snapshot(1)).currentNodeId, null);
  assert.equal(getCampaignProgress(campaign, snapshot(1, [{ checkpointId: 'early-break', status: 'completed' }])).currentNodeId, 'quest-2');
});

test('progress rejects foreign versions, duplicate records, unknown IDs, and impossible unlocks', () => {
  const campaign = campaignFixture();
  assert.throws(() => getCampaignProgress(campaign, { ...snapshot(), campaignVersion: 2 }), /mismatch/);
  assert.throws(() => getCampaignProgress(campaign, { ...snapshot(), completedNodeIds: ['quest-1', 'quest-1'] }), /Duplicate/);
  assert.throws(() => getCampaignProgress(campaign, { ...snapshot(), completedNodeIds: ['unknown'] }), /Unknown/);
  assert.throws(() => getCampaignProgress(campaign, snapshot(6)), /Unmet prerequisites/);
  assert.throws(() => getCampaignProgress(campaign, snapshot(0, [{ checkpointId: 'gate-5', status: 'completed' }])), /Unmet prerequisites/);
  campaign.checkpoints[0].canSkip = false;
  assert.throws(() => getCampaignProgress(campaign, snapshot(5, [{ checkpointId: 'gate-5', status: 'skipped' }])), /cannot be skipped/);
});

test('content validation catches broken references, missing evidence, invalid keys, and duplicate IDs', () => {
  const content = structuredClone(starterContent);
  content.questions[0].correctOptionId = 'missing';
  content.questions[1].evidence = 'outcome';
  content.questions[2].expectedSeconds = 0;
  content.questions.push(content.questions[0]);
  content.quests[0].lessonId = 'missing';
  const errors = validateContent(content).join('\n');
  for (const pattern of [/missing correct option/, /insufficient/, /invalid expected time/, /duplicate ID/, /unknown lesson/]) assert.match(errors, pattern);
});

test('content validation catches prerequisite cycles and unknown checkpoints', () => {
  const campaign = campaignFixture();
  assert.deepEqual(validateContent({ ...starterContent, campaigns: [campaign] }), []);
  campaign.nodes[0].prerequisites = [{ type: 'node_completed', nodeId: 'quest-2' }];
  campaign.nodes[2].prerequisites.push({ type: 'checkpoint_resolved', checkpointId: 'missing' });
  const errors = validateContent({ ...starterContent, campaigns: [campaign] }).join('\n');
  assert.match(errors, /prerequisite cycle/);
  assert.match(errors, /unknown prerequisite/);
});
