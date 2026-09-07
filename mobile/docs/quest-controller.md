# Quest controller and UI hook

`domain/questController.ts` owns an in-memory learning attempt; `hooks/useQuest.ts`
adapts its stable snapshots to React. No navigation, presentation, database calls,
XP writes, or game behavior are implemented here.

For the connected journey, use `hooks/useLearningQuest.ts` instead; see the
[UI contract](ui-contract.md). It enforces access, caches attempts in the root
provider across navigation, automatically saves results, and offers save retry.
The standalone API documented below remains available for content previews.

## Use from a screen

```tsx
import { useQuest } from '../hooks/useQuest'; // adjust relative path from your screen

const quest = useQuest('starter:arrays');
// Or useQuest('starter:traversal') for the second real quest.
// Custom content: useQuest(nodeId, { campaignId, content, attemptKey }).

// Render according to quest.phase:
// lesson   -> quest.lesson (title + introduction), quest.next()
// example  -> quest.example (prompt + steps), quest.next()
// question -> quest.question (prompt + options), quest.requestHint()
//             quest.submitAnswer({ questionId: quest.question.id, selectedOptionId })
// feedback -> quest.feedback, quest.next()
// result   -> quest.result.performance; persistence is explicitly "not_saved"
// error    -> quest.error (unknown node or invalid content)
```

Render an available `error` during the question phase too: invalid options produce
a recoverable message and do not consume a response. The caller passes choice IDs,
not correctness, hints-used flags, or score values.

Other returned fields: title, nodeId, hint, questionNumber, questionCount, and
answeredCount. Nonapplicable phase data is null. `feedback` includes the selected
answer explanation, correct-answer explanation, and success/failure event.
Questions do not expose answer keys, explanations, or hint text before requested.
This is presentation hygiene, not examination security: content is bundled locally.

Keep the custom `content` object referentially stable (for example a module export).
Each hook instance owns one attempt. Changing nodeId, campaignId, content, or the
explicit attemptKey starts a fresh controller. Render once at the screen/container
level and pass its result to child components; separate hook calls do not share an
attempt. Ordinary React renders retain the same controller. Unmounting loses the
in-memory attempt; background/restart persistence is not implemented yet.

## Interaction rules

- Flow: lesson -> worked example -> question -> feedback, repeated per question,
  then result after the final feedback is acknowledged.
- First response locks immediately. Incorrect answers still allow completion.
- Every callback carries the revision it rendered. Duplicate/stale callbacks are
  ignored, including repeated Next taps. A callback from an old node cannot change
  the new node's controller.
- The submitted question ID must match the active question. This prevents an old
  response from answering the next question after navigation.
- Requesting a hint records hint use for the active question; it resets for the
  next question. The controller never trusts a UI-supplied hintUsed flag.
- Challenge timing is deliberately null for this unit. Even a timed question uses
  the agreed neutral fallback until active-time/background tracking is implemented.
- Terminal results are stable; Next/Answer/Hint do not award rewards or restart them.

## Content and persistence boundary

`data/learningContent.ts` composes the original starter quest with an array-traversal
quest. It exposes campaign `starter`, version 2, with nodes `starter:arrays` and
`starter:traversal`. The original one-node `starterContent` remains available at
version 1, preserving existing fixtures. Do not mix version-1 progress with the
version-2 campaign. Existing progress migration is not implemented.

The second node has a configured prerequisite on the first. The controller does
not decide whether a user has access; the connected application service checks
`getCampaignProgress` against durable user state before opening it.

Result fields include campaign/node/quest identity and versions, question versions,
evaluated first responses, a scoring breakdown, and `persistence: 'not_saved'`.
Do not display committed XP/mastery/unlocks from this result. No `retrySave`,
`submitting`, achievement awards, or fake successful-save methods are exported.
The [save service](backend-setup.md) now implements idempotency, replay detection,
XP/mastery updates, and committed receipts. The standalone hook does not call it;
the connected `useLearningQuest` hook does. Visualization is a future content phase, not an
empty screen to insert into this flow now.

## Verification

`npm test` covers both quest flows, invalid choices, stale actions, first-answer
locking, hint tracking, isolated attempts, subscription cleanup, versioned results,
and the distinction between calculated results and saved progression.
`npm run typecheck` checks the React adapter. `npm run lint` checks all source.
The hook has not yet been exercised in a device UI. The shared root layout mounts
the provider; visual route content remains untouched.
