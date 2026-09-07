# PREPPY UI integration contract

**Product update:** every educational node will contain aptitude explanation,
solved example and quiz, followed by DSA explanation, visualization, solved
example and quiz, then combined results. See [the revised plan](combined-node-plan.md).
The section-aware engine is now implemented as an opt-in catalog; see the
[combined quest API](combined-quest-engine.md). It is not active in the UI yet.
Map work can proceed with the existing progress hook and opaque node IDs.
The [full 15-node curriculum and visualization state contract](curriculum.md) is
also available as an opt-in backend catalog. It is not yet enabled in screens.

Valli owns presentation; Figma is the visual source of truth. Use native React
Native components and styles. Screens consume hooks, without implementing scoring
or calling Supabase directly. Preserve `LearningProvider` in `app/_layout.tsx`.
It restores authentication and progress; configuration errors become hook state.
See [backend setup](backend-setup.md) and [Git handoff](valli-handoff.md).

## Implemented hooks

Import each hook from its matching file in `hooks/`:

```tsx
import { useOnboarding } from '../hooks/useOnboarding';
import { useCampaignProgress } from '../hooks/useCampaignProgress';
import { useLearningQuest } from '../hooks/useLearningQuest';
import { useSkills } from '../hooks/useSkills';
```

### Onboarding

`useOnboarding()` returns `status`, `profile`, `campaigns`, `loading`, `submitting`,
`error`, `submit`, and `retry`. Status is `idle`, `loading`, `needs_onboarding`,
`ready`, or `error`. Render loading/error states before choosing a route.

```tsx
const onboarding = useOnboarding();
const accepted = await onboarding.submit({
  name: 'Sammy', dsaLevel: 'beginner', aptitudeLevel: 'intermediate',
  campaignId: 'starter',
});
if (accepted) router.replace('/map'); // router from expo-router
```

Levels: `beginner | intermediate | advanced`. Name is trimmed and must be 1-60
characters. Submit a `campaignId` from `campaigns`, not a `companyId`. Only the
2-node `starter` campaign (version 2) is configured, with no company assignment.
Disable submission while `submitting`; render `error` on failure. Name/preferences
persist in Supabase Auth metadata after progress initialization. Retrying preserves
existing XP/mastery. The full company curriculum is not implemented.

### Map and skills

`useCampaignProgress()` returns `status`, `campaign`, `xp`, `nodes`, `checkpoints`,
`currentNodeId`, `educationCompleted`, `loading`, `error`, and `retry`.
Node status is `locked | available | completed`; render these derived statuses.
IDs are opaque strings. `currentNodeId` can be null at completion or a checkpoint.
Route `needs_onboarding` to onboarding. Empty values before readiness are not
loaded progress.

`useSkills()` returns `skills: [{ id, label, mastery, evidenceCount }]`, `loading`,
`error`, and `retry`. Mastery is 0-100; evidence count distinguishes initial
self-assessment from assessed skill. XP and mastery are separate.

### Saved quests

Use `useLearningQuest(nodeId)` for the real journey. It checks saved prerequisites
and shares one attempt per node for the lifetime of the provider.

| Phase | Render/action |
| --- | --- |
| `loading` | Loading state |
| `needs_onboarding` | Route to onboarding |
| `unavailable` | Locked/unknown message and return to map |
| `error` | Error with `retryLoad()` |
| `lesson` | `lesson`, then `next()` |
| `example` | `example`, then `next()` |
| `question` | `question`, optional `requestHint()`, then `submitAnswer({ questionId, selectedOptionId })` |
| `feedback` | `feedback`, then `next()` |
| `result` | Pending/error/saved result below |

Other fields: `title`, `hint`, `questionNumber`, `questionCount`, `answeredCount`,
`error`, `attemptResult`, `result`, `saveOutcome`, `submitting`, and `saveStatus`.
First responses lock immediately; callbacks reject stale/double taps.

Acknowledging final feedback automatically saves. `attemptResult` is local;
`result` stays null until a committed receipt is available. Show saving state
while `submitting`. On `saveStatus === 'error'`, show `error` and `retrySave()`;
the same attempt ID is reused. Display committed XP/unlocks from saved progress.
Reward animations require `saveOutcome.status === 'saved'` and use
`saveOutcome.xpAwardedNow`; track presentation so remounting does not replay them.
Duplicate/replay outcomes award zero extra XP.

Navigating away/back preserves attempts while the provider lives. Reopening a
finished node returns its cached result; fresh practice/restart is not implemented.
Unsaved attempts do not survive app termination. Committed progress is restored
from Supabase. There is no durable offline queue.

`useQuest(nodeId)` remains a standalone preview hook with no access gating or
persistence; its `result` is unsaved. See [its API](quest-controller.md).
Do not use that preview hook for the saved journey.

## Remaining boundaries

- Visualization phases, achievements, `useGameSession`, and game rewards are not
  implemented. Do not import speculative exports or display fake awards.
- Future 15-node campaigns/checkpoints belong in content configuration, not UI.
- Question timing currently uses the neutral untimed scoring fallback.
- Bimbo assets/motion remain presentation-owned; domain services have no asset paths.
- Keep routes thin and preserve parameter names and the provider. Reusable visuals
  belong in `components/ui/` or `components/screens/`.
- `../game/` belongs to Ayush and is outside this integration.
