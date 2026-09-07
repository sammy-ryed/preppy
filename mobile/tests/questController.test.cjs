const assert = require('node:assert/strict');
const { test } = require('node:test');
const { learningContent } = require('../.domain-test/data/learningContent.js');
const { createQuestController } = require('../.domain-test/domain/questController.js');
const { validateContent } = require('../.domain-test/domain/validateContent.js');
const { getCampaignProgress } = require('../.domain-test/domain/progression.js');

const open = (nodeId = 'starter:arrays') => createQuestController(learningContent, 'starter', nodeId);
const send = (controller, action) => controller.dispatch({ revision: controller.getSnapshot().revision, ...action });
function startQuestions(controller) {
  send(controller, { type: 'next' });
  send(controller, { type: 'next' });
}
function answer(controller, correct = true) {
  const id = controller.getSnapshot().question.id;
  const question = learningContent.questions.find(item => item.id === id);
  send(controller, { type: 'answer', questionId: id, selectedOptionId: correct ? question.correctOptionId : question.options.find(option => option.id !== question.correctOptionId).id });
}

test('both real quests validate and the traversal answer keys are reviewed', () => {
  assert.deepEqual(validateContent(learningContent), []);
  assert.equal(learningContent.campaigns[0].nodes.length, 2);
  const expected = ['Add 7 to total', 'i < 4', '20'];
  learningContent.questions.slice(3).forEach((question, index) => {
    assert.equal(question.options.find(option => option.id === question.correctOptionId).text, expected[index]);
  });
});

for (const nodeId of ['starter:arrays', 'starter:traversal']) {
  test(`${nodeId}: complete flow acknowledges every answer before producing an unsaved result`, () => {
    const controller = open(nodeId);
    assert.equal(controller.getSnapshot().phase, 'lesson');
    assert.ok(controller.getSnapshot().lesson);
    assert.equal(controller.getSnapshot().question, null);
    send(controller, { type: 'next' });
    assert.equal(controller.getSnapshot().phase, 'example');
    assert.ok(controller.getSnapshot().example);
    send(controller, { type: 'next' });
    for (let index = 0; index < 3; index += 1) {
      assert.equal(controller.getSnapshot().questionNumber, index + 1);
      answer(controller);
      assert.equal(controller.getSnapshot().phase, 'feedback');
      assert.equal(controller.getSnapshot().result, null);
      assert.equal(controller.getSnapshot().feedback.correct, true);
      send(controller, { type: 'next' });
    }
    const result = controller.getSnapshot().result;
    assert.equal(controller.getSnapshot().phase, 'result');
    assert.equal(result.performance.score, 95);
    assert.equal(result.persistence, 'not_saved');
    assert.equal(result.campaignVersion, 2);
    assert.equal(result.answers.length, 3);
    assert.equal(Object.keys(result.questionVersions).length, 3);
    assert.equal('xpEarned' in result, false);
    assert.equal(controller.getSnapshot().question, null);
  });
}

test('double next cannot skip the worked example, and unanswered questions cannot advance', () => {
  const controller = open();
  const action = { type: 'next', revision: 0 };
  controller.dispatch(action);
  controller.dispatch(action);
  assert.equal(controller.getSnapshot().phase, 'example');
  send(controller, { type: 'next' });
  const before = controller.getSnapshot();
  send(controller, { type: 'next' });
  assert.equal(controller.getSnapshot(), before);
});

test('first answer is locked even if a corrected answer arrives immediately or after feedback', () => {
  const controller = open();
  startQuestions(controller);
  const oldRevision = controller.getSnapshot().revision;
  const question = learningContent.questions[0];
  answer(controller, false);
  controller.dispatch({ type: 'answer', revision: oldRevision, questionId: question.id, selectedOptionId: question.correctOptionId });
  send(controller, { type: 'answer', questionId: question.id, selectedOptionId: question.correctOptionId });
  assert.equal(controller.getSnapshot().feedback.correct, false);
  assert.equal(controller.getSnapshot().answeredCount, 1);
  send(controller, { type: 'next' });
  send(controller, { type: 'answer', questionId: question.id, selectedOptionId: question.correctOptionId });
  assert.equal(controller.getSnapshot().phase, 'question');
  assert.equal(controller.getSnapshot().answeredCount, 1);
});

test('invalid choices report a recoverable error without consuming a response', () => {
  const controller = open();
  startQuestions(controller);
  send(controller, { type: 'answer', questionId: controller.getSnapshot().question.id, selectedOptionId: 'not-an-option' });
  assert.ok(controller.getSnapshot().error);
  assert.equal(controller.getSnapshot().answeredCount, 0);
  answer(controller);
  assert.equal(controller.getSnapshot().error, null);
  assert.equal(controller.getSnapshot().phase, 'feedback');
});

test('answer keys and hints remain out of the question presentation until requested/submitted', () => {
  const controller = open();
  startQuestions(controller);
  const view = controller.getSnapshot();
  for (const key of ['correctOptionId', 'explanation', 'distractorFeedback', 'hint']) assert.equal(key in view.question, false);
  assert.equal(view.feedback, null);
  assert.equal(view.hint, null);
  send(controller, { type: 'hint' });
  assert.ok(controller.getSnapshot().hint);
  answer(controller);
  assert.equal(controller.getSnapshot().feedback.hintUsed, true);
  send(controller, { type: 'next' });
  assert.equal(controller.getSnapshot().hint, null);
  answer(controller);
  assert.equal(controller.getSnapshot().feedback.hintUsed, false);
});

test('untimed behavior is explicit, wrong answers do not block finishing, and final results are stable', () => {
  const controller = open();
  startQuestions(controller);
  for (let index = 0; index < 3; index += 1) { answer(controller, false); send(controller, { type: 'next' }); }
  const final = controller.getSnapshot();
  assert.equal(final.result.performance.score, 0);
  assert.ok(final.result.answers.every(response => response.activeSeconds === null));
  send(controller, { type: 'next' });
  send(controller, { type: 'hint' });
  assert.equal(controller.getSnapshot(), final);
});

test('subscriptions get stable snapshots, no-op actions do not notify, and unsubscribe works', () => {
  const controller = open();
  let calls = 0;
  const unsubscribe = controller.subscribe(() => { calls += 1; });
  assert.equal(controller.getSnapshot(), controller.getSnapshot());
  controller.dispatch({ type: 'next', revision: -1 });
  assert.equal(calls, 0);
  send(controller, { type: 'next' });
  assert.equal(calls, 1);
  unsubscribe();
  send(controller, { type: 'next' });
  assert.equal(calls, 1);
});

test('attempts are isolated and foreign nodes/broken content fail before launch', () => {
  const first = open();
  const second = open('starter:traversal');
  startQuestions(first);
  answer(first);
  assert.equal(second.getSnapshot().phase, 'lesson');
  assert.throws(() => open('missing'), /Unknown quest node/);
  assert.throws(() => createQuestController(learningContent, 'other-company', 'starter:arrays'), /Unknown/);
  const broken = structuredClone(learningContent);
  broken.quests[0].questionIds = ['missing'];
  assert.throws(() => createQuestController(broken, 'starter', 'starter:arrays'), /Invalid learning content/);
});

test('completing an in-memory attempt does not mutate progress; a saved completion would unlock quest two', () => {
  const campaign = learningContent.campaigns[0];
  const progress = { campaignId: campaign.id, campaignVersion: campaign.version, completedNodeIds: [], checkpoints: [] };
  const controller = open();
  startQuestions(controller);
  for (let index = 0; index < 3; index += 1) { answer(controller); send(controller, { type: 'next' }); }
  assert.equal(getCampaignProgress(campaign, progress).nodes[1].status, 'locked');
  // A read-model fixture, not a persistence implementation.
  const saved = { ...progress, completedNodeIds: [controller.getSnapshot().result.nodeId] };
  assert.equal(getCampaignProgress(campaign, saved).nodes[1].status, 'available');
});
