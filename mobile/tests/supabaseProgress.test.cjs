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
  await db.exec(readFileSync(join(__dirname, '../../supabase/migrations/202609080001_game_sessions.sql'), 'utf8'));
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

  await t.test('combined results survive SQL roundtrip and forged section scores are recalculated', async () => {
    const { combinedContent } = require('../.domain-test/data/combinedContent.js');
    const combined = createLearningService(combinedContent, repository);
    const combinedKey = { userId: user1, campaignId: 'combined-demo' };
    await combined.initializeProgress(combinedKey, { aptitudeLevel: 'beginner', dsaLevel: 'beginner' });
    const controller = createQuestController(combinedContent, 'combined-demo', 'combined-demo:foundations');
    for (let i = 0; i < 80 && controller.getSnapshot().phase !== 'result'; i++) {
      const view = controller.getSnapshot();
      if (view.phase === 'question') {
        const q = combinedContent.questions.find(item => item.id === view.question.id);
        controller.dispatch({ type: 'answer', revision: view.revision, questionId: q.id, selectedOptionId: q.correctOptionId });
      } else controller.dispatch({ type: view.phase === 'visualization' && !view.visualization.canContinue ? 'visualization_next' : 'next', revision: view.revision });
    }
    const attempt = controller.getSnapshot().result;
    assert.ok(attempt);
    const forged = { ...attempt, sectionPerformances: [{ subject: 'dsa', skillId: 'arrays', performance: { score: 999 } }] };
    const saved = await combined.saveAttempt(combinedKey, 'combined-first', forged);
    assert.deepEqual(saved.receipt.sectionPerformances.map(s => s.performance.score), [95, 95]);
    assert.equal(saved.progress.xp, 150);
    assert.deepEqual(await combined.readProgress(combinedKey), saved.progress);
    const duplicate = await repository.commit({ key: combinedKey, campaignVersion: 1, expectedRevision: 0,
      receipt: saved.receipt, skills: saved.progress.skills });
    assert.equal(duplicate.status, 'duplicate');
    assert.equal(duplicate.xpAwardedNow, 0);
    const badRow = (await db.query('select * from public.preppy_user_progress where campaign_id = $1', ['combined-demo'])).rows[0];
    badRow.node_results['combined-demo:foundations'].sectionPerformances[0].performance.score = 999;
    assert.throws(() => decodeProgress(badRow), /Malformed/);
  });

  await t.test('all 15 curriculum nodes persist with checkpoint gates, regrading, and one reward each', async () => {
    const { curriculumContent, CURRICULUM_ID } = require('../.domain-test/data/curriculum/index.js');
    const curriculum = createLearningService(curriculumContent, repository);
    const curriculumKey = { userId: user1, campaignId: CURRICULUM_ID };
    const campaign = curriculumContent.campaigns[0];
    const initial = await curriculum.initializeProgress(curriculumKey, { aptitudeLevel: 'beginner', dsaLevel: 'beginner' });
    assert.equal(initial.xp, 0);
    let total = 0;
    const checkpoints = [];
    const completed = node => {
      const c = createQuestController(curriculumContent, CURRICULUM_ID, node.id);
      for (let i=0; i<600 && c.getSnapshot().phase !== 'result'; i++) {
        const v=c.getSnapshot();
        if(v.phase==='question') {
          const q=curriculumContent.questions.find(q=>q.id===v.question.id);
          c.dispatch({type:'answer',revision:v.revision,questionId:q.id,selectedOptionId:q.correctOptionId});
        } else c.dispatch({type:v.phase==='visualization'&&!v.visualization.canContinue?'visualization_next':'next',revision:v.revision});
      }
      assert.ok(c.getSnapshot().result);
      return c.getSnapshot().result;
    };
    await assert.rejects(curriculum.saveAttempt(curriculumKey, 'early', completed(campaign.nodes[1])), /locked/);
    for (const [index,node] of campaign.nodes.entries()) {
      const attempt=completed(node);
      const before=await curriculum.readProgress(curriculumKey);
      await assert.rejects(curriculum.saveAttempt(curriculumKey, `partial-${index}`, {...attempt,answers:attempt.answers.slice(0,3)}));
      assert.deepEqual(await curriculum.readProgress(curriculumKey),before);
      if(index===5||index===10) {
        await assert.rejects(curriculum.saveAttempt(curriculumKey, `locked-${index}`,attempt), /locked/);
        // Test fixture only: emulate the future game service resolving its checkpoint.
        // Production authenticated clients still cannot update the table directly.
        checkpoints.push({checkpointId:campaign.checkpoints[index/5-1].id,status:'completed'});
        await db.exec('reset role');
        await db.query('update public.preppy_user_progress set checkpoints=$1, revision=revision+1 where user_id=$2 and campaign_id=$3',
          [JSON.stringify(checkpoints),user1,CURRICULUM_ID]);
        await login(user1);
      }
      const outcomes=await Promise.all([curriculum.saveAttempt(curriculumKey,`node-${index}`,attempt),curriculum.saveAttempt(curriculumKey,`node-${index}`,attempt)]);
      assert.equal(outcomes.reduce((sum,o)=>sum+o.xpAwardedNow,0),node.baseXp+50);
      total+=node.baseXp+50;
      const saved=await curriculum.readProgress(curriculumKey);
      assert.equal(saved.xp,total);
      assert.equal(Object.keys(saved.nodeResults).length,index+1);
      assert.deepEqual(saved.nodeResults[node.id].sectionPerformances.map(s=>s.performance.score),[95,95]);
      assert.equal(saved.nodeResults[node.id].skillChanges.length,2);
      const replay=await curriculum.saveAttempt(curriculumKey,`replay-${index}`,attempt);
      assert.equal(replay.status,'replay'); assert.equal(replay.xpAwardedNow,0);
      assert.deepEqual(await curriculum.readProgress(curriculumKey),saved);
    }
    assert.equal(total,2625);
    const restored=await createLearningService(curriculumContent,createSupabaseProgressRepository(client)).readProgress(curriculumKey);
    assert.equal(restored.xp,2625);
    assert.deepEqual(restored.checkpoints,checkpoints);
    assert.deepEqual(restored.nodeResults[campaign.nodes[14].id].unlockedCheckpointIds,[campaign.checkpoints[2].id]);
    assert.equal(restored.nodeResults[campaign.nodes[4].id].unlockedNodeIds.length,0);
    assert.deepEqual(await curriculum.initializeProgress(curriculumKey,{aptitudeLevel:'advanced',dsaLevel:'advanced'}),restored);
  });

  await t.test('game sessions validate gates, cancel stale sessions, and atomically award once', async () => {
    const campaign='placement-foundations-v1';
    const call=async (checkpoint,session,action,score=0,coins=0)=>(await db.query('select public.preppy_game_action($1,$2,$3,$4,$5,$6) as value',
      [campaign,`${campaign}:${checkpoint}`,session,action,score,coins])).rows[0].value;
    await assert.rejects(call('missing','bad','start'),/Unknown checkpoint/);
    await assert.rejects(call('finalBoss','bad','complete'),/No active session/);
    assert.equal((await call('finalBoss','cancel-me','start')).status,'active');
    assert.equal((await call('finalBoss','cancel-me','cancel')).status,'cancelled');
    await assert.rejects(call('finalBoss','cancel-me','complete'),/No active session/);
    await call('finalBoss','old','start');await call('finalBoss','new','start');
    await assert.rejects(call('finalBoss','old','complete'),/No active session/);
    await assert.rejects(call('finalBoss','new','complete',-1),/Invalid game result/);
    const first=await call('finalBoss','new','complete',200,3);
    assert.equal(first.xpAwardedNow,100);assert.equal(first.progress.xp,2725);
    const duplicate=await call('finalBoss','new','complete',200,3);
    assert.equal(duplicate.xpAwardedNow,0);assert.equal(duplicate.progress.xp,2725);
    assert.equal((await call('finalBoss','another','skip')).xpAwardedNow,0);
    await assert.rejects(db.query("update public.preppy_game_sessions set score=999"),/permission denied/);
    await login(user2);
    await assert.rejects(call('break1','locked','start'),/Checkpoint locked/);
    // Seed a valid first-five-nodes snapshot for the second identity, as a fixture.
    await db.exec('reset role');
    await db.query(`insert into public.preppy_user_progress(user_id,campaign_id,campaign_version,skills,node_results,xp)
      select $1,campaign_id,campaign_version,skills,
        (select jsonb_object_agg(key,value) from jsonb_each(node_results) where key <= 'placement-foundations-v1:node-05'),750
      from public.preppy_user_progress where user_id=$2 and campaign_id=$3`,[user2,user1,campaign]);
    await login(user2);
    await assert.rejects(call('break1','new','start'),/Session identity mismatch/);
    const skipped=await call('break1','skip-test','skip');
    assert.equal(skipped.status,'skipped');assert.equal(skipped.progress.xp,750);assert.equal(skipped.xpAwardedNow,0);
    assert.equal((await call('break1','skip-test','complete')).xpAwardedNow,0);
    assert.equal((await db.query('select * from public.preppy_game_sessions where user_id=$1',[user1])).rows.length,0);
    await db.exec('reset role');
    await db.query('delete from public.preppy_user_progress where user_id=$1 and campaign_id=$2',[user2,campaign]);
    await login(user1);
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
