// Explicit live smoke test. Default is read-only; --write creates two test users.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { learningContent } = require('../.domain-test/data/learningContent.js');
const { createQuestController } = require('../.domain-test/domain/questController.js');
const { createLearningService } = require('../.domain-test/services/learningService.js');
const { createSupabaseProgressRepository } = require('../.domain-test/repositories/supabaseProgressRepository.js');

let stage = 'configuration';
const clients = [];
function pass(label) { console.log(`PASS: ${label}`); }
function checkResponse(response) {
  if (response.error) throw new Error('Backend request failed');
  return response.data;
}
function complete(nodeId) {
  const controller = createQuestController(learningContent, 'starter', nodeId);
  for (let step = 0; step < 50; step++) {
    const view = controller.getSnapshot();
    if (view.phase === 'result') return view.result;
    if (view.phase === 'question') {
      const question = learningContent.questions.find(item => item.id === view.question.id);
      controller.dispatch({ type: 'answer', revision: view.revision,
        questionId: question.id, selectedOptionId: question.correctOptionId });
    } else controller.dispatch({ type: 'next', revision: view.revision });
  }
  throw new Error('Quest did not finish');
}

async function main() {
  process.loadEnvFile('.env');
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  assert.ok(url && key?.startsWith('sb_publishable_'));
  assert.equal(new URL(url).protocol, 'https:');
  const timedFetch = (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20000) });
  const client = () => {
    const instance = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false,
      detectSessionInUrl: false }, global: { fetch: timedFetch } });
    clients.push(instance);
    return instance;
  };
  stage = 'Supabase auth settings';
  const response = await timedFetch(new URL('/auth/v1/settings', url), { headers: { apikey: key } });
  assert.equal(response.status, 200);
  const settings = await response.json();
  pass('URL and publishable key accepted');
  stage = 'unauthenticated progress RPC protection';
  const publicClient = client();
  const probe = await publicClient.rpc('preppy_read_progress', {
    p_user_id: '00000000-0000-0000-0000-000000000000', p_campaign_id: 'starter',
  });
  assert.equal(probe.error?.code, '42501');
  pass('progress RPC exists and rejects unauthenticated access');
  stage = 'anonymous sign-in setting (enable it in Supabase Authentication)';
  assert.equal(settings.external?.anonymous_users, true);
  pass('anonymous sign-in enabled');
  if (!process.argv.includes('--write')) {
    console.log('Read-only checks complete. Use --write for test-user saves and isolation checks.');
    return;
  }
  console.log('Creating two isolated smoke-test users; their test records remain in Supabase.');
  const first = client();
  stage = 'create first anonymous test user';
  const auth = checkResponse(await first.auth.signInAnonymously({ options: { data: { preppy_smoke_test: true } } }));
  const progressKey = { userId: auth.user.id, campaignId: 'starter' };
  const service = createLearningService(learningContent, createSupabaseProgressRepository(first));
  stage = 'initialize progress and persist onboarding profile';
  const profile = { name: 'PREPPY smoke test', campaignId: 'starter', dsaLevel: 'beginner', aptitudeLevel: 'beginner' };
  const initial = await service.initializeProgress(progressKey, profile);
  assert.equal(initial.xp, 0);
  checkResponse(await first.auth.updateUser({ data: { preppy_profile: profile } }));
  assert.deepEqual(checkResponse(await first.auth.getUser()).user.user_metadata.preppy_profile, profile);
  pass('anonymous auth, onboarding metadata, and progress initialization');
  stage = 'save first quest and verify duplicate protection';
  const attemptId = randomUUID();
  const result = complete('starter:arrays');
  const saved = await service.saveAttempt(progressKey, attemptId, result);
  assert.equal(saved.status, 'saved');
  assert.equal(saved.progress.xp, 150);
  assert.equal(saved.progress.skills.arrays.mastery, 50);
  assert.deepEqual(saved.receipt.unlockedNodeIds, ['starter:traversal']);
  const duplicate = await service.saveAttempt(progressKey, attemptId, result);
  assert.equal(duplicate.status, 'duplicate');
  assert.equal(duplicate.xpAwardedNow, 0);
  assert.equal(duplicate.progress.xp, 150);
  pass('committed XP/mastery/unlock and duplicate protection');
  stage = 'restore session in a new client and complete second quest';
  const restored = client();
  checkResponse(await restored.auth.setSession({ access_token: auth.session.access_token, refresh_token: auth.session.refresh_token }));
  const reopened = createLearningService(learningContent, createSupabaseProgressRepository(restored));
  assert.deepEqual(await reopened.readProgress(progressKey), saved.progress);
  assert.deepEqual(checkResponse(await restored.auth.getUser()).user.user_metadata.preppy_profile, profile);
  const second = await reopened.saveAttempt(progressKey, randomUUID(), complete('starter:traversal'));
  assert.equal(second.progress.xp, 300);
  assert.equal(second.progress.skills.arrays.mastery, 64);
  assert.deepEqual(await reopened.initializeProgress(progressKey, profile), second.progress);
  pass('new-client restoration, second quest, and non-resetting onboarding');
  stage = 'second-user isolation';
  const other = client();
  const otherAuth = checkResponse(await other.auth.signInAnonymously({ options: { data: { preppy_smoke_test: true } } }));
  const otherService = createLearningService(learningContent, createSupabaseProgressRepository(other));
  assert.equal(await otherService.readProgress({ userId: otherAuth.user.id, campaignId: 'starter' }), null);
  const denied = await other.rpc('preppy_read_progress', { p_user_id: auth.user.id, p_campaign_id: 'starter' });
  assert.ok(denied.error);
  const visible = checkResponse(await other.from('preppy_user_progress').select('user_id').eq('user_id', auth.user.id));
  assert.deepEqual(visible, []);
  pass('cross-user RPC denial and table RLS');
  console.log('Live smoke test passed. Native AsyncStorage and screen behavior still require a phone check.');
}

main().catch(() => {
  // Never print SDK errors, URLs, keys, sessions, or profiles to the console.
  console.error(`FAIL: ${stage}. Check setup/network and rerun; credentials were not logged.`);
  process.exitCode = 1;
}).finally(async () => {
  await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })));
});
