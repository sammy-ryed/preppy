const assert = require('node:assert/strict');
const { test } = require('node:test');
const { learningContent } = require('../.domain-test/data/learningContent.js');
const { createLearningApplication } = require('../.domain-test/services/learningApplication.js');
const { createLearningService } = require('../.domain-test/services/learningService.js');

const profile = { name: 'Sammy', campaignId: 'starter', dsaLevel: 'beginner', aptitudeLevel: 'intermediate' };
function setup() {
  const rows = new Map();
  let storedProfile = null;
  let calls = 0;
  const clone = value => structuredClone(value);
  const repository = {
    async read(key) { return clone(rows.get(key.campaignId) ?? null); },
    async initialize(initial) {
      if (!rows.has(initial.campaignId)) rows.set(initial.campaignId, clone(initial));
      return clone(rows.get(initial.campaignId));
    },
    async commit(input) {
      const old = rows.get(input.key.campaignId);
      const existing = old.nodeResults[input.receipt.nodeId];
      if (existing) return clone({ status: existing.attemptId === input.receipt.attemptId ? 'duplicate' : 'replay', receipt: existing, progress: old, xpAwardedNow: 0 });
      if (old.revision !== input.expectedRevision) return { status: 'conflict' };
      const progress = { ...old, revision: old.revision + 1, xp: old.xp + input.receipt.xpEarned, skills: input.skills,
        nodeResults: { ...old.nodeResults, [input.receipt.nodeId]: input.receipt } };
      rows.set(input.key.campaignId, clone(progress));
      return clone({ status: 'saved', receipt: input.receipt, progress, xpAwardedNow: input.receipt.xpEarned });
    },
  };
  const backend = { userId: 'test-user', learningService: createLearningService(learningContent, repository),
    readProfile: async () => clone(storedProfile), saveProfile: async value => { storedProfile = clone(value); } };
  const connect = async () => { calls += 1; return backend; };
  const application = createLearningApplication(learningContent, connect);
  return { application, backend, connect, connectionCalls: () => calls };
}
function finish(handle) {
  while (handle.controller.getSnapshot().phase !== 'result') {
    const view = handle.controller.getSnapshot();
    if (view.phase === 'question') {
      const question = learningContent.questions.find(item => item.id === view.question.id);
      handle.controller.dispatch({ type: 'answer', revision: view.revision, questionId: question.id, selectedOptionId: question.correctOptionId });
    } else handle.controller.dispatch({ type: 'next', revision: view.revision });
  }
}
async function ready(setupResult) {
  await setupResult.application.bootstrap();
  assert.equal(await setupResult.application.submitOnboarding(profile), true);
}

test('bootstrap coalesces concurrent calls and exposes onboarding without invented progress', async () => {
  const { application, connectionCalls } = setup();
  const first = application.bootstrap();
  assert.equal(application.getSnapshot().status, 'loading');
  assert.equal(first, application.bootstrap());
  await first;
  assert.equal(connectionCalls(), 1);
  assert.equal(application.getSnapshot().status, 'needs_onboarding');
  assert.equal(application.getSnapshot().progress, null);
  assert.equal(application.getQuest('starter:arrays'), null);
});

test('missing backend configuration is recoverable and does not crash the provider store', async () => {
  const { backend } = setup();
  let fail = true;
  const application = createLearningApplication(learningContent, async () => {
    if (fail) throw new Error('Add configuration to mobile/.env');
    return backend;
  });
  await application.bootstrap();
  assert.equal(application.getSnapshot().status, 'error');
  assert.match(application.getSnapshot().error, /configuration/);
  fail = false;
  await application.bootstrap();
  assert.equal(application.getSnapshot().status, 'needs_onboarding');
});

test('onboarding validates fields and does not expose ready before profile persistence succeeds', async () => {
  const { application, backend } = setup();
  await application.bootstrap();
  assert.equal(await application.submitOnboarding({ ...profile, name: ' ' }), false);
  assert.match(application.getSnapshot().error, /name/);
  assert.equal(await application.submitOnboarding({ ...profile, campaignId: 'unknown' }), false);
  assert.equal(await application.submitOnboarding({ ...profile, dsaLevel: 'expert' }), false);
  const saveProfile = backend.saveProfile;
  backend.saveProfile = async () => { throw new Error('Profile save failed'); };
  assert.equal(await application.submitOnboarding(profile), false);
  assert.equal(application.getSnapshot().status, 'needs_onboarding');
  assert.equal(application.getSnapshot().progress, null);
  assert.equal(application.getSnapshot().submittingOnboarding, false);
  backend.saveProfile = saveProfile;
  assert.equal(await application.submitOnboarding({ ...profile, name: ' Sammy ' }), true);
  assert.equal(application.getSnapshot().profile.name, 'Sammy');
  assert.equal(application.getSnapshot().progress.skills.arrays.mastery, 30);
});

test('double onboarding submission uses one operation and completed onboarding cannot reset progress', async () => {
  const { application } = setup();
  await application.bootstrap();
  const first = application.submitOnboarding(profile);
  assert.equal(first, application.submitOnboarding(profile));
  await first;
  const before = application.getSnapshot().progress;
  assert.equal(await application.submitOnboarding({ ...profile, dsaLevel: 'advanced' }), false);
  assert.equal(application.getSnapshot().progress, before);
});

test('quest access enforces locks and navigation reuses the same in-memory attempt', async () => {
  const result = setup();
  await ready(result);
  const { application } = result;
  assert.equal(application.getQuest('missing'), null);
  assert.equal(application.getQuest('starter:traversal'), null);
  const handle = application.getQuest('starter:arrays');
  handle.controller.dispatch({ type: 'next', revision: 0 });
  assert.equal(application.getQuest('starter:arrays'), handle);
  assert.equal(application.getQuest('starter:arrays').controller.getSnapshot().phase, 'example');
});

test('saved quest publishes committed rewards and unlocks without duplicate requests', async () => {
  const result = setup();
  await ready(result);
  const { application } = result;
  const handle = application.getQuest('starter:arrays');
  assert.equal(await application.saveQuest(handle), null);
  finish(handle);
  const first = application.saveQuest(handle);
  assert.equal(application.getSnapshot().saves[handle.attemptId].status, 'saving');
  assert.equal(application.getSnapshot().progress.xp, 0);
  assert.equal(first, application.saveQuest(handle));
  const saved = await first;
  assert.equal(saved.xpAwardedNow, 150);
  assert.equal(application.getSnapshot().progress.xp, 150);
  assert.ok(application.getQuest('starter:traversal'));
  assert.equal(await application.saveQuest(handle), saved);
  assert.equal(application.getSnapshot().progress.revision, 1);
});

test('failed saves retain the attempt and stable ID for explicit retry', async () => {
  const result = setup();
  await ready(result);
  const { application, backend } = result;
  const handle = application.getQuest('starter:arrays');
  finish(handle);
  const saveAttempt = backend.learningService.saveAttempt;
  backend.learningService.saveAttempt = async () => { throw new Error('Offline'); };
  assert.equal(await application.saveQuest(handle), null);
  assert.equal(application.getSnapshot().saves[handle.attemptId].status, 'error');
  assert.equal(application.getSnapshot().progress.xp, 0);
  assert.equal(application.getQuest('starter:arrays'), handle);
  backend.learningService.saveAttempt = saveAttempt;
  assert.equal((await application.saveQuest(handle)).status, 'saved');
});

test('a lost committed response is recovered as a duplicate without a second reward', async () => {
  const result = setup();
  await ready(result);
  const { application, backend } = result;
  const handle = application.getQuest('starter:arrays');
  finish(handle);
  const saveAttempt = backend.learningService.saveAttempt;
  backend.learningService.saveAttempt = async (...args) => { await saveAttempt(...args); throw new Error('Response lost'); };
  await application.saveQuest(handle);
  assert.equal(application.getSnapshot().progress.xp, 0);
  backend.learningService.saveAttempt = saveAttempt;
  const recovered = await application.saveQuest(handle);
  assert.equal(recovered.status, 'duplicate');
  assert.equal(recovered.xpAwardedNow, 0);
  assert.equal(application.getSnapshot().progress.xp, 150);
});

test('startup restores profile/progress and a late refresh cannot overwrite a newer save', async () => {
  const result = setup();
  await ready(result);
  const { application, backend, connect } = result;
  const initial = application.getSnapshot().progress;
  const readProgress = backend.learningService.readProgress;
  let release;
  backend.learningService.readProgress = () => new Promise(resolve => { release = resolve; });
  const refreshing = application.refresh();
  backend.learningService.readProgress = readProgress;
  const handle = application.getQuest('starter:arrays');
  finish(handle);
  await application.saveQuest(handle);
  release(initial);
  await refreshing;
  assert.equal(application.getSnapshot().progress.xp, 150);
  const restarted = createLearningApplication(learningContent, connect);
  await restarted.bootstrap();
  assert.equal(restarted.getSnapshot().status, 'ready');
  assert.equal(restarted.getSnapshot().profile.name, 'Sammy');
  assert.equal(restarted.getSnapshot().progress.xp, 150);
});

test('refresh errors retain committed data and subscriptions can unsubscribe', async () => {
  const result = setup();
  await ready(result);
  const { application, backend } = result;
  const before = application.getSnapshot().progress;
  let notifications = 0;
  const unsubscribe = application.subscribe(() => { notifications += 1; });
  backend.learningService.readProgress = async () => { throw new Error('Offline'); };
  await application.refresh();
  assert.equal(application.getSnapshot().progress, before);
  assert.equal(application.getSnapshot().status, 'ready');
  assert.equal(notifications, 1);
  unsubscribe();
  await application.refresh();
  assert.equal(notifications, 1);
});
