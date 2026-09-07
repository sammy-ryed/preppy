const assert = require('node:assert/strict');
const { test } = require('node:test');
const { learningContent } = require('../.domain-test/data/learningContent.js');
const { createQuestController } = require('../.domain-test/domain/questController.js');
const { createLearningService } = require('../.domain-test/services/learningService.js');

function attempt(nodeId = 'starter:arrays') {
  const controller = createQuestController(learningContent, 'starter', nodeId);
  const next = () => controller.dispatch({ type: 'next', revision: controller.getSnapshot().revision });
  next(); next();
  while (controller.getSnapshot().phase !== 'result') {
    const view = controller.getSnapshot();
    if (view.phase === 'question') {
      const question = learningContent.questions.find(item => item.id === view.question.id);
      controller.dispatch({ type: 'answer', revision: view.revision, questionId: question.id, selectedOptionId: question.correctOptionId });
    } else next();
  }
  return controller.getSnapshot().result;
}

// An atomic test double, never used by the application as fake durable storage.
function memoryRepository() {
  const rows = new Map();
  const id = key => JSON.stringify([key.userId, key.campaignId]);
  const clone = value => structuredClone(value);
  return {
    async read(key) { return clone(rows.get(id(key)) ?? null); },
    async initialize(initial) {
      if (!rows.has(id(initial))) rows.set(id(initial), clone(initial));
      return clone(rows.get(id(initial)));
    },
    async commit(input) {
      const progress = rows.get(id(input.key));
      const old = progress.nodeResults[input.receipt.nodeId];
      if (old) return clone({ status: old.attemptId === input.receipt.attemptId ? 'duplicate' : 'replay', progress, receipt: old, xpAwardedNow: 0 });
      if (progress.revision !== input.expectedRevision) return { status: 'conflict' };
      const saved = { ...progress, skills: clone(input.skills), xp: progress.xp + input.receipt.xpEarned, revision: progress.revision + 1,
        nodeResults: { ...progress.nodeResults, [input.receipt.nodeId]: clone(input.receipt) } };
      rows.set(id(input.key), saved);
      return clone({ status: 'saved', progress: saved, receipt: input.receipt, xpAwardedNow: input.receipt.xpEarned });
    },
  };
}
const key = { userId: 'student-1', campaignId: 'starter' };
const levels = { dsaLevel: 'beginner', aptitudeLevel: 'advanced' };
const fixedNow = () => new Date('2026-09-07T12:00:00Z');

test('save applies XP, mastery and next-node unlock together and survives service recreation', async () => {
  const repository = memoryRepository();
  const service = createLearningService(learningContent, repository, fixedNow);
  await service.initializeProgress(key, levels);
  const outcome = await service.saveAttempt(key, 'attempt-1', attempt());
  assert.equal(outcome.status, 'saved');
  assert.equal(outcome.xpAwardedNow, 150);
  assert.equal(outcome.progress.skills.arrays.mastery, 50);
  assert.equal(outcome.progress.skills.arrays.evidenceCount, 3);
  assert.deepEqual(outcome.receipt.unlockedNodeIds, ['starter:traversal']);
  assert.equal(outcome.receipt.persistence, 'saved');
  const reopened = createLearningService(learningContent, repository);
  assert.deepEqual(await reopened.readProgress(key), outcome.progress);
  const second = await reopened.saveAttempt(key, 'attempt-2', attempt('starter:traversal'));
  assert.equal(second.progress.xp, 300);
  assert.equal(second.progress.skills.arrays.mastery, 64);
});

test('reinitialization never resets completed progress or mastery', async () => {
  const service = createLearningService(learningContent, memoryRepository());
  await service.initializeProgress(key, levels);
  const saved = await service.saveAttempt(key, 'first', attempt());
  assert.deepEqual(await service.initializeProgress(key, { dsaLevel: 'advanced', aptitudeLevel: 'advanced' }), saved.progress);
});

test('duplicate save and replay return original receipt with zero newly awarded XP', async () => {
  const service = createLearningService(learningContent, memoryRepository());
  await service.initializeProgress(key, levels);
  const saved = await service.saveAttempt(key, 'first', attempt());
  const duplicate = await service.saveAttempt(key, 'first', attempt());
  const replay = await service.saveAttempt(key, 'second', attempt());
  assert.equal(duplicate.status, 'duplicate');
  assert.equal(replay.status, 'replay');
  assert.equal(duplicate.xpAwardedNow, 0);
  assert.deepEqual(duplicate.receipt, saved.receipt);
  assert.deepEqual(replay.progress, saved.progress);
});

test('simultaneous submissions award exactly once', async () => {
  const service = createLearningService(learningContent, memoryRepository());
  await service.initializeProgress(key, levels);
  const outcomes = await Promise.all([service.saveAttempt(key, 'same', attempt()), service.saveAttempt(key, 'same', attempt())]);
  assert.equal(outcomes.reduce((sum, value) => sum + value.xpAwardedNow, 0), 150);
  assert.equal((await service.readProgress(key)).revision, 1);
});

test('lost success response can be retried without replaying or doubling the reward', async () => {
  const repository = memoryRepository();
  const realCommit = repository.commit;
  let loseResponse = true;
  repository.commit = async input => {
    const saved = await realCommit(input);
    if (loseResponse) { loseResponse = false; throw new Error('Network response lost'); }
    return saved;
  };
  const service = createLearningService(learningContent, repository);
  await service.initializeProgress(key, levels);
  await assert.rejects(service.saveAttempt(key, 'stable', attempt()), /Network/);
  const retry = await service.saveAttempt(key, 'stable', attempt());
  assert.equal(retry.status, 'duplicate');
  assert.equal(retry.progress.xp, 150);
});

test('write failure preserves original progress and allows a retry', async () => {
  const repository = memoryRepository();
  const realCommit = repository.commit;
  repository.commit = async () => { throw new Error('Offline'); };
  const service = createLearningService(learningContent, repository);
  const initial = await service.initializeProgress(key, levels);
  await assert.rejects(service.saveAttempt(key, 'stable', attempt()), /Offline/);
  assert.deepEqual(await service.readProgress(key), initial);
  repository.commit = realCommit;
  assert.equal((await service.saveAttempt(key, 'stable', attempt())).status, 'saved');
});

test('revision conflicts reread state and retries are bounded', async () => {
  const repository = memoryRepository();
  const realCommit = repository.commit;
  let calls = 0;
  repository.commit = input => ++calls === 1 ? Promise.resolve({ status: 'conflict' }) : realCommit(input);
  const service = createLearningService(learningContent, repository);
  await service.initializeProgress(key, levels);
  assert.equal((await service.saveAttempt(key, 'stable', attempt())).status, 'saved');
  assert.equal(calls, 2);
  calls = 0;
  repository.commit = async () => { calls += 1; return { status: 'conflict' }; };
  await assert.rejects(service.saveAttempt(key, 'next', attempt('starter:traversal')), /changed repeatedly/);
  assert.equal(calls, 3);
});

test('locked, incomplete, foreign and outdated attempts cannot change progress', async () => {
  const service = createLearningService(learningContent, memoryRepository());
  const initial = await service.initializeProgress(key, levels);
  await assert.rejects(service.saveAttempt(key, 'locked', attempt('starter:traversal')), /locked/);
  await assert.rejects(service.saveAttempt(key, 'partial', { ...attempt(), answers: [] }), /Exactly one/);
  await assert.rejects(service.saveAttempt(key, 'old', { ...attempt(), campaignVersion: 1 }), /version/);
  await assert.rejects(service.saveAttempt(key, 'old', { ...attempt(), questionVersions: {} }), /version/);
  await assert.rejects(service.saveAttempt(key, 'other', { ...attempt(), nodeId: 'foreign' }), /Unknown node/);
  assert.deepEqual(await service.readProgress(key), initial);
});

test('supplied score/correctness fields are ignored in favor of answer-key evaluation', async () => {
  const service = createLearningService(learningContent, memoryRepository());
  await service.initializeProgress(key, levels);
  const forged = structuredClone(attempt());
  forged.answers = forged.answers.map(answer => {
    const question = learningContent.questions.find(item => item.id === answer.questionId);
    return { ...answer, selectedOptionId: question.options.find(option => option.id !== question.correctOptionId).id, correct: true };
  });
  forged.performance.score = 100;
  const saved = await service.saveAttempt(key, 'forged', forged);
  assert.equal(saved.receipt.performance.score, 0);
  assert.equal(saved.progress.xp, 100);
});

test('users stay separate and an attempt ID cannot be reused for another node', async () => {
  const service = createLearningService(learningContent, memoryRepository());
  await service.initializeProgress(key, levels);
  const other = { ...key, userId: 'student-2' };
  await service.initializeProgress(other, levels);
  await service.saveAttempt(key, 'one', attempt());
  assert.equal((await service.readProgress(other)).xp, 0);
  await assert.rejects(service.saveAttempt(key, 'one', attempt('starter:traversal')), /already used/);
});
