const { test } = require('node:test');
const assert = require('node:assert/strict');
const { curriculumContent: content } = require('../.domain-test/data/curriculum/index.js');
const { evaluateAttempt } = require('../.domain-test/domain/evaluateAnswer.js');
const { calculateNodePerformance, calculateXP, updateMastery } = require('../.domain-test/domain/scoring.js');
const { sectionPerformances } = require('../.domain-test/domain/sectionPerformance.js');
const { questResultSummary } = require('../.domain-test/domain/questResultSummary.js');

test('all 960 answer patterns across 15 nodes match independent weighted score, XP and separate skill calculations', () => {
  for (const node of content.campaigns[0].nodes) {
    const quest = content.quests.find(item => item.id === node.questId);
    const questions = quest.questionIds.map(id => content.questions.find(item => item.id === id));
    for (let pattern = 0; pattern < 64; pattern++) {
      const bits = questions.map((_, i) => Number(Boolean(pattern & (1 << i))));
      const answers = evaluateAttempt(questions, questions.map((question, i) => ({
        questionId: question.id, selectedOptionId: bits[i] ? question.correctOptionId : question.options.find(option => option.id !== question.correctOptionId).id,
        hintUsed: Boolean(i % 2), activeSeconds: null,
      })));
      const score = calculateNodePerformance(answers);
      const reasoningCorrect = bits[0] + bits[1] + bits[3] + bits[4];
      const outcomesCorrect = bits[2] + bits[5];
      assert.equal(score.score, Math.round(70 * reasoningCorrect / 4 + 25 * outcomesCorrect / 2));
      assert.equal(calculateXP(node.baseXp, score.accuracy, { isReplay: false }), node.baseXp + 25 * outcomesCorrect);
      assert.equal(calculateXP(node.baseXp, score.accuracy, { isReplay: true }), 0);
      sectionPerformances(quest, answers).forEach((section, i) => {
        const offset = i * 3;
        const sectionScore = 35 * (bits[offset] + bits[offset + 1]) + 25 * bits[offset + 2];
        assert.equal(section.performance.score, sectionScore);
        const previous = { mastery: 55, evidenceCount: 9 };
        const next = updateMastery(previous, section.skillId, answers, { isReplay: false });
        assert.equal(next.mastery, Math.round(55 * 0.7 + sectionScore * 0.3));
        assert.equal(next.evidenceCount, 12);
        assert.deepEqual(updateMastery(previous, section.skillId, answers, { isReplay: true }), previous);
      });
    }
  }
});

test('replay results display current performance and never misrepresent original skill rewards as new', () => {
  const current = { performance: { score: 0 }, answers: [{ correct: false, evidence: 'outcome', activeSeconds: null, expectedSeconds: null }], sectionPerformances: [] };
  const original = { ...current, performance: { score: 95 }, skillChanges: [{ skillId: 'arrays', before: { mastery: 30 }, after: { mastery: 50 } }] };
  const replay = questResultSummary(current, { status: 'replay', receipt: original, xpAwardedNow: 0 });
  assert.equal(replay.result.performance.score, 0);
  assert.equal(replay.correctCount, 0);
  assert.equal(replay.xpAwarded, 0);
  assert.equal(replay.replay, true);
  assert.deepEqual(replay.skillChanges, []);
  const pending = questResultSummary(current, null);
  assert.equal(pending.saved, false);
  assert.deepEqual(pending.skillChanges, []);
  const saved = questResultSummary(current, { status: 'saved', receipt: { ...current, skillChanges: original.skillChanges }, xpAwardedNow: 100 });
  assert.equal(saved.saved, true);
  assert.equal(saved.xpAwarded, 100);
});
