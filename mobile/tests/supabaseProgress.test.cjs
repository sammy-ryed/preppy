/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const { learningContent } = require('../.domain-test/data/learningContent.js');
const { createQuestController } = require('../.domain-test/domain/questController.js');
const { createLearningService } = require('../.domain-test/services/learningService.js');
const { createSupabaseProgressRepository, decodeProgress } = require('../.domain-test/repositories/supabaseProgressRepository.js');

function completedAttempt(nodeId = 'starter:arrays') {
  const controller = createQuestController(learningContent, 'starter', nodeId);
  while (controller.getSnapshot().phase !== 'result') {
    const view = controller.getSnapshot();
    if (view.phase === 'question') {
      const question = learningContent.questions.find(item => item.id === view.question.id);
      controller.dispatch({ type: 'answer', revision: view.revision, questionId: question.id, selectedOptionId: question.correctOptionId });
    } else controller.dispatch({ type: 'next', revision: view.revision });
  }
  return controller.getSnapshot().result;
}

test('PostgreSQL migration and RPC adapter integration', async t => {
  const db = new PGlite();
  t.after(() => db.close());
  // Emulate only Supabase's auth schema/claims; the migration, roles and RLS run in Postgres.
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    insert into auth.users values ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
  `);
  await db.exec(readFileSync(join(__dirname, '../../supabase/migrations/202609070001_learning_progress.sql'), 'utf8'));
  const user1 = '11111111-1111-4111-8111-111111111111';
  const user2 = '22222222-2222-4222-8222-222222222222';
  async function login(userId) {
    await db.exec('reset role; set role authenticated;');
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  }
  await login(user1);
  const rpcDefinitions = {
    preppy_read_progress: ['p_user_id', 'p_campaign_id'],
    preppy_initialize_progress: ['p_user_id', 'p_campaign_id', 'p_campaign_version', 'p_skills'],
    preppy_commit_node: ['p_user_id', 'p_campaign_id', 'p_campaign_version', 'p_expected_revision', 'p_receipt', 'p_skills'],
  };
  const client = { async rpc(name, args) {
    try {
      const names = rpcDefinitions[name];
      assert.ok(names, 'Only known RPCs are allowed');
      const params = names.map(key => typeof args[key] === 'object' ? JSON.stringify(args[key]) : args[key]);
      const response = await db.query(`select public.${name}(${params.map((_, index) => `$${index + 1}`).join(', ')}) as value`, params);
      return { data: response.rows[0].value, error: null };
    } catch (error) { return { data: null, error: { message: error.message } }; }
  } };
  const repository = createSupabaseProgressRepository(client);
  const service = createLearningService(learningContent, repository);
  const key = { userId: user1, campaignId: 'starter' };
  let first;

  await t.test('initialize, commit, reread and initialize-again preserve the same durable row', async () => {
    assert.equal(await service.readProgress(key), null);
    await service.initializeProgress(key, { dsaLevel: 'beginner', aptitudeLevel: 'beginner' });
    first = await service.saveAttempt(key, 'first-attempt', completedAttempt());
    assert.equal(first.progress.xp, 150);
    assert.equal(first.progress.skills.arrays.mastery, 50);
    assert.deepEqual(first.receipt.unlockedNodeIds, ['starter:traversal']);
    assert.deepEqual(await service.initializeProgress(key, { dsaLevel: 'advanced', aptitudeLevel: 'advanced' }), first.progress);
    assert.deepEqual(await createLearningService(learningContent, createSupabaseProgressRepository(client)).readProgress(key), first.progress);
  });

  await t.test('database deduplicates before revision checks and refuses attempt reuse', async () => {
    const input = { key, campaignVersion: 2, expectedRevision: 0, receipt: first.receipt, skills: first.progress.skills };
    const duplicate = await repository.commit(input);
    assert.equal(duplicate.status, 'duplicate');
    assert.equal(duplicate.xpAwardedNow, 0);
    assert.equal(duplicate.progress.revision, 1);
    const replay = await repository.commit({ ...input, receipt: { ...first.receipt, attemptId: 'practice' } });
    assert.equal(replay.status, 'replay');
    await assert.rejects(repository.commit({ ...input, expectedRevision: 1, receipt: { ...first.receipt, nodeId: 'starter:traversal' } }), /already used/);
  });

  await t.test('stale revisions return conflict and invalid updates leave every field unchanged', async () => {
    const input = { key, campaignVersion: 2, expectedRevision: 0, receipt: { ...first.receipt, nodeId: 'starter:traversal', attemptId: 'second' }, skills: first.progress.skills };
    assert.deepEqual(await repository.commit(input), { status: 'conflict' });
    await assert.rejects(repository.commit({ ...input, expectedRevision: 1, skills: { arrays: { mastery: 150, evidenceCount: 6 } } }), /Invalid skill/);
    await assert.rejects(repository.commit({ ...input, expectedRevision: 1, receipt: { ...input.receipt, xpEarned: -1 } }), /Invalid XP/);
    assert.deepEqual(await service.readProgress(key), first.progress);
  });

  await t.test('concurrent duplicate service submissions only award the second quest once', async () => {
    const result = completedAttempt('starter:traversal');
    const results = await Promise.all([service.saveAttempt(key, 'second', result), service.saveAttempt(key, 'second', result)]);
    assert.equal(results.reduce((sum, item) => sum + item.xpAwardedNow, 0), 150);
    assert.equal((await service.readProgress(key)).xp, 300);
    assert.equal((await service.readProgress(key)).revision, 2);
  });

  await t.test('authenticated user cannot directly mutate rows or impersonate another user', async () => {
    await assert.rejects(db.query('update public.preppy_user_progress set xp = 999'), /permission denied/);
    await assert.rejects(db.query('delete from public.preppy_user_progress'), /permission denied/);
    await assert.rejects(service.readProgress({ userId: user2, campaignId: 'starter' }), /Unauthorized/);
    await assert.rejects(service.initializeProgress({ userId: user2, campaignId: 'starter' }, { dsaLevel: 'beginner', aptitudeLevel: 'beginner' }), /Unauthorized/);
    await login(user2);
    const visible = await db.query('select * from public.preppy_user_progress');
    assert.equal(visible.rows.length, 0);
    await assert.rejects(repository.commit({ key, campaignVersion: 2, expectedRevision: 2, receipt: first.receipt, skills: first.progress.skills }), /Unauthorized/);
    const other = await service.initializeProgress({ userId: user2, campaignId: 'starter' }, { dsaLevel: 'advanced', aptitudeLevel: 'beginner' });
    assert.equal(other.xp, 0);
    assert.equal(other.skills.arrays.mastery, 75);
  });

  await t.test('anonymous database role cannot invoke progress functions', async () => {
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select public.preppy_read_progress($1, $2)', [user1, 'starter']), /permission denied/);
  });
});

test('adapter rejects malformed database responses rather than inventing saved progress', async () => {
  assert.throws(() => decodeProgress({}), /Malformed/);
  assert.throws(() => decodeProgress({ user_id: 'user', campaign_id: 'starter', campaign_version: 2, revision: 0, xp: NaN, skills: {}, node_results: {}, checkpoints: [] }), /Malformed/);
  const repository = createSupabaseProgressRepository({ rpc: async () => ({ data: null, error: { message: 'Connection failed' } }) });
  await assert.rejects(repository.read({ userId: 'user', campaignId: 'starter' }), /Connection failed/);
});
