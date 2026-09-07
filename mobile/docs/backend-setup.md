# Supabase connection and learning saves

## Your setup steps

1. In your Supabase project, obtain the project URL and **publishable** API key
   (starts with `sb_publishable_`). Put them in `mobile/.env`:

   ```dotenv
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   ```

   A blank ignored `.env` was created locally. On another checkout, copy
   `.env.example` to `.env`. Existing `.env` files are never overwritten.
   Expo bundles `EXPO_PUBLIC_` values into the app. Never use a service-role or
   secret key here. This integration deliberately accepts publishable keys only.

2. Enable **Anonymous sign-ins** in Supabase Authentication settings. An anonymous
   signed-in user has the authenticated database role and an individual user ID;
   it is not the unauthenticated `anon` database role.
3. Run `supabase/migrations/202609070001_learning_progress.sql` from the repository
   root in your project's SQL Editor once (or apply it through your migration
   workflow). It creates one table and three RPC functions. It was not deployed
   to a hosted project during implementation.
4. Restart Expo from `mobile/`: `npm.cmd start -- --clear` on Windows, or
   `npm start -- --clear` elsewhere.

The root learning provider now attempts backend initialization on mount. Missing
configuration produces actionable hook error state while children still render,
so presentation development can continue. No fake user or save is substituted.

## Application service API

```ts
import { connectLearningBackend } from '../services/backend';

const { userId, learningService } = await connectLearningBackend();
const key = { userId, campaignId: 'starter' };

// On successful onboarding. Repeating this preserves existing progress.
const progress = await learningService.initializeProgress(key, {
  dsaLevel: 'beginner',
  aptitudeLevel: 'intermediate',
});

// completedAttempt is useQuest(...).result after the last feedback is acknowledged.
// The attempt ID must be stable for retries, unique per user/campaign attempt,
// and at most 128 characters. useLearningQuest owns it in the connected journey.
const saved = await learningService.saveAttempt(key, attemptId, completedAttempt);
const refreshed = await learningService.readProgress(key);
```

The service returns `{ status, receipt, progress, xpAwardedNow }`.

- `saved`: first completion committed. `xpAwardedNow` contains the new award.
- `duplicate`: that attempt already committed; the original receipt is returned.
- `replay`: this node was completed by another attempt; practice earns no new XP
  or mastery update. The receipt describes the original completion, not the replay.
- Duplicate/replay `xpAwardedNow` is zero even though the historical receipt retains
  its original `xpEarned`. Do not play another reward animation based on that field.

Receipts contain re-evaluated answers, score breakdown, campaign/content versions,
XP, skill changes, newly unlocked IDs, and the server completion timestamp.
`progress` contains the current aggregate XP/skills/results. Statuses are derived
with `getCampaignProgress(campaign, toProgressSnapshot(progress))`.

Services/auth and repository code belong to Sammy. Valli consumes the implemented
application hooks/providers, not Supabase directly. `useLearningQuest` automatically
saves after final feedback and exposes retry state; `useQuest` remains an unsaved
preview. See [the UI contract](ui-contract.md). Visual routes are still placeholders.

## Persistence and correctness

`preppy_user_progress` has a composite primary key `(user_id, campaign_id)`, a
foreign key to Supabase `auth.users`, campaign version, revision, XP, JSON skills,
JSON node receipts, JSON checkpoint states, and created/updated timestamps.
There is no content table, leaderboard, badge engine, or game-session table in this
migration. The application stores name and onboarding preferences in Auth metadata
under `preppy_profile`, after initializing progress. Metadata is for preferences,
not authorization. The visual profile form remains Valli's work.

- Anonymous sessions persist through AsyncStorage on native and Supabase's browser
  storage on web. Native token refreshing follows app foreground/background state.
- Repeated simultaneous auth initialization shares one sign-in promise.
- The service requires initialized progress, matching content versions, complete
  first responses, and an available node. It re-evaluates answer IDs, ignoring
  supplied correctness, score, XP, or skill claims.
- The RPC locks the progress row. Receipt, XP and skills update in one transaction.
- Node deduplication precedes revision comparison. A retry after a lost successful
  response returns the original receipt and cannot award twice.
- Revision conflicts cause the service to reread/recalculate, with at most three
  commit attempts. Network failures are surfaced for explicit retry with the same
  attempt ID/result; no speculative reward is shown.
- Checkpoint states are preserved by node saves. Completing a node may unlock a
  checkpoint, but this unit cannot complete/skip games.
- RLS limits reads to the current user. Direct table mutation is revoked for app
  roles. Write RPCs explicitly verify `auth.uid()` and use a fixed empty search path.

This remains a client-evaluated hackathon learning system. The database enforces
ownership, bounded numeric fields, atomicity and duplicate protection; it does not
re-grade static content or verify curriculum prerequisites independently. A modified
client can forge its own learning results. Do not treat these scores as secure exams
or a cheat-resistant public leaderboard.

## What is verified

### Hosted verification: 2026-09-07

The configured hosted project was reached with its publishable key. Anonymous
sign-ins were initially disabled; after enabling them, the live smoke test passed:
Auth profile metadata, initialized progress, both real quest saves (150 then 300
XP), arrays mastery (50 then 64), next-node unlock, duplicate retry with zero
additional XP, restoration in a new SDK client, and non-resetting initialization.
A second user was denied access by both the read RPC and table RLS.

Run from `mobile/`:

```powershell
npm.cmd run verify:backend
npm.cmd run verify:backend -- --write
```

The default performs read-only configuration/auth-setting/RPC checks. `--write`
creates two anonymous smoke-test users, tagged `preppy_smoke_test: true` in Auth
metadata, and one user's test progress. These records remain in the project;
the script does not delete users, persist session tokens to disk, or print keys.
Each write run creates new identities. It never uses the phone's current session.
No service-role key is needed. The existing hosted schema supported all tested
operations; no migration was applied by the agent during this verification.

New-client restoration verifies the hosted API, not native AsyncStorage or app
restart behavior on a device. Physical-device UI and background/resume checks
remain outstanding. The script uses the real learning service/repository/controller;
it does not mount React or exercise the provider's Expo auth adapter.

### Earlier local verification

Before the UI merge: 66 tests passed; TypeScript, ESLint, Expo dependency alignment,
and Android/iOS/web production exports all passed. The merged onboarding UI has
six known animation lint errors assigned to Valli; those are separate from the
hosted smoke test above.

- Unit tests: first save, mastery/XP, node unlock, repeat initialization, replay,
  concurrent duplicates, lost responses, failed writes, bounded conflict retries,
  locked/invalid/stale content, forged grading fields, and separate user state.
- Real PostgreSQL (PGlite) tests execute this migration and the actual RPC adapter:
  commit/read, duplicate-before-revision behavior, rollback, revision conflicts,
  concurrent duplicate calls, direct-write rejection, and cross-user RLS/ownership.
  PGlite is a single-connection database; production multi-connection contention
  still needs hosted verification. Supabase's auth schema/claims are simulated only
  in the test setup; these tests do not exercise hosted Auth or HTTP/PostgREST.
- Native/web screen startup and session restoration on a phone still need device
  verification. Hosted Supabase calls are now verified as described above.
- Application tests cover onboarding retries, access gating, shared attempts,
  automatic-save orchestration, lost responses, and stale refresh protection.
- Pending unsaved attempts are still in memory. An offline queue, visual save
  UI, and recovery of a never-committed attempt after app termination are not built.
  Successfully committed progress is read back from Supabase after reconnecting.

## Commands used

From `mobile/` (Windows):

```powershell
npx.cmd expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
npm.cmd install --save-dev @electric-sql/pglite
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:dependencies
npm.cmd run export
```

Docker was detected but its daemon was unavailable, so SQL tests use PGlite.
The initial lint check identified `__dirname` in the CommonJS SQL test; an explicit
file-local global declaration fixed it. npm still reports the scaffold's 13 moderate
dependency advisories; no forced dependency changes were applied.

After configuration, verify on your device: initialize -> save node 1 -> read XP
and skills -> restart -> read the same progress -> retry the same completion ->
confirm zero extra XP -> complete node 2. Also test a second anonymous identity to
confirm isolation through the real Supabase API.
