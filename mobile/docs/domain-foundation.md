# Sammy's domain foundation

Implemented without React, navigation, Supabase, clocks, or asset imports. Routes
and Valli's presentation remain unchanged. This is the first domain unit, not yet
a working persisted learning flow.

## Available now

- `types/content.ts`: versioned questions/quests/campaigns, lessons, prerequisite types.
- `types/learning.ts`: submitted and evaluated answers, score breakdowns, skill
  estimates, and a minimal progress read model.
- `data/starter.ts`: one authored arrays quest with a lesson, worked example,
  two reasoning questions, and one separate outcome question. Each distractor has
  specific feedback. This one-node starter is not a full company campaign.
- `domain/validateContent.ts`: authored-content checks for IDs, references, answer
  keys, evidence coverage, numeric metadata, and prerequisite cycles.
- `domain/evaluateAnswer.ts`: answer feedback and complete-attempt validation.
- `domain/scoring.ts`: performance, mastery seeding/update, and XP calculation.
- `domain/progression.ts`: derives node/checkpoint statuses from prerequisites.

Run `validateContent(catalog)` at the future content bootstrap boundary; do not
serve invalid content. It returns all discovered issues as strings. These are
checks for typed, authored data, not a general untrusted-JSON parser.

## Scoring contract, version 1

`evaluateAnswer(question, submission)` returns semantic feedback immediately.
The caller must lock that first response before revealing feedback.
`evaluateAttempt(questions, submissions)` requires exactly one first response per
question, orders output by the question list, and rejects duplicates/missing or
foreign answers. It computes correctness from the answer key; it does not accept
a supplied correct flag. It cannot establish that a caller preserved the historical
first response; the upcoming quest controller owns that lifecycle.

Pass evaluated responses to `calculateNodePerformance`:

```text
C = proportion of process questions correct
A = proportion of outcome questions correct

Each outcome question contributes to time:
  incorrect                  -> 0
  correct and untimed         -> 0.5
  correct and timed           -> min(1, expectedSeconds / activeSeconds)
T = mean of those contributions across outcome questions

score = round(70*C + 20*A + 10*T)
```

Responses belong to one evidence bucket only. Difficulty, completion, and hints
do not apply additional correctness multipliers. Timing is gated on correctness
to avoid rewarding fast incorrect guesses. No timed deadline is assigned to the
starter quest: all correct yields 95; all incorrect yields 0. Untimed means either
no configured expected time or null measured active time. Positive finite challenge
time must exclude lesson reading and background time; zero/invalid values are rejected.

Returned process/accuracy/time are fractions in [0,1]; `points` gives their actual
weighted contributions. The score is an integer; contribution values are unrounded.
Weights and the scoring version are isolated in `SCORING`.

`seedMastery` uses beginner=30, intermediate=55, advanced=75, all with zero evidence.
`updateMastery(previous, skillId, answers, { isReplay })` selects evidence for that
skill only. With at least two process answers and one outcome answer:

```text
newMastery = round(oldMastery*0.70 + skillPerformance*0.30)
```

Insufficient evidence, an unassessed skill, or a replay leaves the estimate unchanged.
Evidence count increases only for a qualifying first completion. Mastery is an
explainable estimate, not a calibrated ability measurement.

`calculateXP(baseXp, accuracy, { isReplay })` awards baseXp + round(50*accuracy)
for first completion, and zero for replay. It accepts the outcome accuracy fraction,
not the overall score. Game XP and badge award rules are not implemented yet.
The caller must establish replay status from durable progress; these pure helpers
do not provide persistence or transaction-level duplicate protection.

## Progression read model

`getCampaignProgress(campaign, snapshot)` accepts matching campaign ID/version and
returns sorted nodes with locked/available/completed states, checkpoint states,
currentNodeId (nullable), and educationCompleted.

The snapshot has completedNodeIds and one latest status per checkpoint. Completed
and explicitly skipped checkpoints satisfy prerequisites; active/cancelled sessions
do not. Non-skippable checkpoint skips and inconsistent progress are rejected.
The snapshot is a domain read model, not an agreed Supabase storage schema.

The production function contains no special-case node numbers. Tests exercise
configured breaks after 5/10/15 and an alternate break after node 1. The 15-node
campaign is test-only; it is not exposed as real content. Final educational
completion is independent of final game completion.

## Checks and next unit

```sh
npm test
npm run typecheck
npm run lint
```

Tests use the existing TypeScript compiler plus Node's built-in test runner; no new
dependencies. `tsconfig.domain.json` compiles just pure domain/data/types to ignored
`.domain-test/`. It deliberately excludes browser/React globals to catch coupling.

The [quest controller and useQuest hook](quest-controller.md) now implement the
in-memory attempt lifecycle and a second real quest. The [save service and Supabase
adapter](backend-setup.md) now add persistence and replay checks at a repository
boundary. Next connect these services through application providers/hooks before
attaching committed XP/unlocks to Valli's screens. Visualizations, achievements,
and Godot remain separate subsequent units.
