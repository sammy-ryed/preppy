const assert = require('node:assert/strict');
const { test } = require('node:test');
const { combinedContent } = require('../.domain-test/data/combinedContent.js');
const { learningContent } = require('../.domain-test/data/learningContent.js');
const { validateContent } = require('../.domain-test/domain/validateContent.js');
const { arrayTraversalSteps } = require('../.domain-test/domain/arrayTraversal.js');
const { createQuestController } = require('../.domain-test/domain/questController.js');
const { createLearningApplication } = require('../.domain-test/services/learningApplication.js');
const { createLearningService } = require('../.domain-test/services/learningService.js');

const open = () => createQuestController(combinedContent, 'combined-demo', 'combined-demo:foundations');
const dispatch = (c, type) => c.dispatch({ type, revision: c.getSnapshot().revision });
function advance(c, wrongSubject) {
  const v = c.getSnapshot();
  if (v.phase === 'question') {
    const q = combinedContent.questions.find(q => q.id === v.question.id);
    c.dispatch({ type: 'answer', revision: v.revision, questionId: q.id,
      selectedOptionId: v.section.subject === wrongSubject ? q.options.find(o => o.id !== q.correctOptionId).id : q.correctOptionId });
  } else dispatch(c, v.phase === 'visualization' && !v.visualization.canContinue ? 'visualization_next' : 'next');
}
function finish(c, wrongSubject) {
  for (let i = 0; i < 80 && c.getSnapshot().phase !== 'result'; i++) advance(c, wrongSubject);
  assert.equal(c.getSnapshot().phase, 'result');
  return c.getSnapshot().result;
}

test('combined content has balanced evidence and leaves the active catalog unchanged', () => {
  assert.deepEqual(validateContent(combinedContent), []);
  assert.equal(learningContent.campaigns.length, 1);
  assert.equal(learningContent.campaigns[0].id, 'starter');
  assert.equal(learningContent.campaigns[0].version, 2);
  const correct = Object.fromEntries(combinedContent.questions.map(q => [q.id, q.options.find(o => o.id === q.correctOptionId).text]));
  assert.equal(correct['percent-part'], String(240 / 4));
  assert.equal(correct['traversal-sum-outcome'], String(6 + 2 + 9 + 3));
});

test('exact combined order, first-answer locking, and no result after aptitude alone', () => {
  const c = open();
  const phases = [];
  for (let i = 0; i < 80 && c.getSnapshot().phase !== 'result'; i++) {
    const v = c.getSnapshot();
    const key = `${v.section.subject}:${v.phase}`;
    if (phases.at(-1) !== key) phases.push(key);
    assert.equal(v.result, null);
    if (v.section.subject === 'dsa' && v.phase === 'lesson') assert.equal(v.answeredCount, 3);
    advance(c);
    // A stale callback from before any successful transition must have no effect.
    const after = c.getSnapshot();
    c.dispatch({ type: 'next', revision: v.revision });
    assert.equal(c.getSnapshot(), after);
  }
  assert.deepEqual(phases, ['aptitude:lesson', 'aptitude:example',
    'aptitude:question', 'aptitude:feedback', 'aptitude:question', 'aptitude:feedback', 'aptitude:question', 'aptitude:feedback',
    'dsa:lesson', 'dsa:visualization', 'dsa:example',
    'dsa:question', 'dsa:feedback', 'dsa:question', 'dsa:feedback', 'dsa:question', 'dsa:feedback']);
  assert.equal(c.getSnapshot().result.answers.length, 6);
  assert.equal(c.getSnapshot().result.performance.score, 95);
});

test('visualization computes immutable steps and enforces boundaries, reset, and completion', () => {
  const input = [2, 5, 1];
  const steps = arrayTraversalSteps(input);
  input[0] = 99;
  assert.deepEqual(steps.map(s => s.sum), [0, 2, 7, 8]);
  assert.deepEqual(steps.map(s => s.activeIndex), [null, 0, 1, 2]);
  assert.deepEqual(steps[0].values, [2, 5, 1]);
  assert.ok(Object.isFrozen(steps) && Object.isFrozen(steps[0]) && Object.isFrozen(steps[0].values));
  assert.deepEqual(arrayTraversalSteps([-2, 0, 2]).map(s => s.sum), [0, -2, -2, 0]);
  for (const bad of [[], [NaN], [1.5], [Number.MAX_SAFE_INTEGER, 1], Array(21).fill(0)]) assert.throws(() => arrayTraversalSteps(bad));
  const c = open();
  while (c.getSnapshot().phase !== 'visualization') advance(c);
  const initial = c.getSnapshot();
  dispatch(c, 'next'); dispatch(c, 'visualization_previous');
  assert.equal(c.getSnapshot(), initial);
  dispatch(c, 'visualization_next'); dispatch(c, 'visualization_previous');
  assert.equal(c.getSnapshot().visualization.step, 1);
  dispatch(c, 'visualization_next'); dispatch(c, 'visualization_reset');
  assert.equal(c.getSnapshot().visualization.sum, 0);
  for (let i = 0; i < 5; i++) dispatch(c, 'visualization_next');
  assert.equal(c.getSnapshot().visualization.step, 4);
  assert.equal(c.getSnapshot().visualization.canContinue, true);
  dispatch(c, 'next');
  assert.equal(c.getSnapshot().phase, 'example');
});

test('subject performance is isolated when aptitude is wrong and DSA is correct', () => {
  const result = finish(open(), 'aptitude');
  assert.deepEqual(result.sectionPerformances.map(s => s.performance.score), [0, 95]);
  assert.equal(result.performance.score, 48);
});

test('invalid combined structures cannot launch', () => {
  const mutations = [
    q => q.sections.reverse(),
    q => q.sections.pop(),
    q => { q.sections[1].visualization = undefined; },
    q => { q.sections[1].visualization.values = []; },
    q => { q.sections[0].skillId = 'arrays'; },
    q => { q.sections[0].lessonId = 'missing'; },
    q => { q.sections[0].questionIds.pop(); },
    q => { q.questionIds.reverse(); },
  ];
  for (const mutate of mutations) {
    const data = structuredClone(combinedContent);
    mutate(data.quests[0]);
    assert.ok(validateContent(data).length);
    assert.throws(() => createQuestController(data, 'combined-demo', 'combined-demo:foundations'), /Invalid learning content/);
  }
});

test('application saves once after both sections, retains retry, and updates skills independently', async () => {
  const content = structuredClone(combinedContent);
  content.campaigns[0].nodes.push({ ...content.campaigns[0].nodes[0], id: 'test:next', order: 2,
    prerequisites: [{ type: 'node_completed', nodeId: 'combined-demo:foundations' }] });
  let row = null;
  let writes = 0;
  let fail = true;
  const repository = {
    read: async () => structuredClone(row),
    initialize: async initial => structuredClone(row ??= initial),
    commit: async input => {
      writes++;
      if (fail) { fail = false; throw new Error('offline'); }
      row = { ...row, revision: row.revision + 1, xp: row.xp + input.receipt.xpEarned,
        skills: input.skills, nodeResults: { [input.receipt.nodeId]: input.receipt } };
      return { status: 'saved', progress: structuredClone(row), receipt: input.receipt, xpAwardedNow: input.receipt.xpEarned };
    },
  };
  const service = createLearningService(content, repository);
  const app = createLearningApplication(content, async () => ({ userId: 'test', learningService: service,
    readProfile: async () => null, saveProfile: async () => {} }), () => 'stable-attempt');
  await app.bootstrap();
  await app.submitOnboarding({ name: 'Test', dsaLevel: 'beginner', aptitudeLevel: 'beginner', campaignId: 'combined-demo' });
  const handle = app.getQuest('combined-demo:foundations');
  while (handle.controller.getSnapshot().section.subject === 'aptitude') advance(handle.controller, 'aptitude');
  assert.equal(await app.saveQuest(handle), null);
  assert.equal(writes, 0);
  assert.equal(app.getQuest('test:next'), null);
  const result = finish(handle.controller, 'aptitude');
  await assert.rejects(service.saveAttempt({ userId: 'test', campaignId: 'combined-demo' }, 'partial',
    { ...result, answers: result.answers.slice(0, 3) }));
  assert.equal(writes, 0);
  assert.equal(await app.saveQuest(handle), null);
  assert.equal(app.getSnapshot().progress.xp, 0);
  assert.equal(app.getQuest('test:next'), null);
  const saved = await app.saveQuest(handle);
  assert.equal(saved.receipt.attemptId, 'stable-attempt');
  assert.equal(saved.progress.xp, 125);
  assert.equal(saved.progress.skills.quantitative_aptitude.mastery, 21);
  assert.equal(saved.progress.skills.arrays.mastery, 50);
  assert.equal(saved.progress.skills.arrays.evidenceCount, 3);
  assert.equal(saved.progress.skills.quantitative_aptitude.evidenceCount, 3);
  assert.deepEqual(saved.receipt.unlockedNodeIds, ['test:next']);
  assert.ok(app.getQuest('test:next'));
  assert.equal(writes, 2);
  await app.saveQuest(handle);
  assert.equal(writes, 2);
  const duplicate = await service.saveAttempt({ userId: 'test', campaignId: 'combined-demo' }, 'stable-attempt', result);
  assert.equal(duplicate.xpAwardedNow, 0);
});
