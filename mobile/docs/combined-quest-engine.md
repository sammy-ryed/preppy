# Combined quest engine: implemented domain API

The full [15-node curriculum](curriculum.md) is now authored separately from this
original one-node demo. The visualization engine supports all curriculum topics;
the array-traversal fields below describe the first demo's visualization only.

Every new combined quest follows aptitude lesson -> aptitude example -> aptitude
quiz/feedback -> DSA lesson -> visualization -> DSA example -> DSA quiz/feedback
-> result. Three quiz questions per subject (two process, one outcome) keep the
subjects equally weighted. Existing single-section starter quests still work.

## Availability and UI boundary

`data/combinedContent.ts` exports a separate, opt-in catalog. Campaign
`combined-demo` version 1 contains node `combined-demo:foundations` and quest
`percentages-and-arrays`. It reuses the reviewed array-traversal lesson/questions
and adds percentages material. This is one complete authored node, not 15 nodes.

No routes, components, styles, assets, provider configuration, or game files were
changed. The app still uses `learningContent` and its two legacy starter nodes.
Do not activate the combined catalog until Valli's quest presentation handles
the new phase. Existing Supabase profiles/progress were not migrated or reset.

For pure engine use:

```ts
import { combinedContent } from '../data/combinedContent';
import { createQuestController } from '../domain/questController';

const controller = createQuestController(
  combinedContent, 'combined-demo', 'combined-demo:foundations',
);
```

For later UI integration, the standalone `useQuest` accepts this content and
campaign through its existing options. Connected use requires an application
created with the same catalog and a backend learning service using that catalog;
passing content to a preview hook does not change the active Supabase service.
Campaign selection/switching for existing users is a separate integration task.

## Additive hook fields

Both `useQuest` and `useLearningQuest` expose:

- `section`: subject (`aptitude`/`dsa`), 1-based section `number`, `count`,
  section `questionCount` and `answeredCount`; null for legacy quests or result.
- `visualization`: only in phase `visualization`. Includes `type`, array `values`,
  `activeIndex`, `visitedCount`, running `sum`, 1-based `step`, `stepCount`, and
  `canContinue`. The first step shows total zero with no active item.
- `nextVisualizationStep()`, `previousVisualizationStep()`, `resetVisualization()`.
  These move state only; there is no renderer, animation, autoplay, or timer.

Normal `next()` cannot leave visualization until its last step. Previous/reset
returns it to earlier steps; reach the last step again before continuing.
All actions retain revision guards. Repeated/stale callbacks cannot skip learning
phases or answer the next question. Existing question counts remain whole-node
counts, while `section` supplies per-subject counts. Result stays null after the
aptitude quiz; both quizzes and their final feedback must be acknowledged.

## Results and saves

Combined attempts and saved receipts include `sectionPerformances`, ordered
aptitude then DSA, each with subject, skill ID, and the existing score breakdown.
The field is absent for legacy results. `skillChanges` on the saved receipt
contains separate before/after mastery for each assessed skill.

The save service recalculates all scores from answer IDs, including section
scores; supplied section performance claims are ignored. It rejects partial
attempts before any write and saves both skills, one XP award, one receipt, and
unlocks atomically. Existing JSON receipt storage supports the additive field;
no SQL migration is required. The repository validates section scores on read.

With beginner seeds and all six correct: each subject scores 95 using the
untimed fallback, both skill estimates move 30 -> 50, and total XP is 150
(base 100 plus accuracy bonus 50). All aptitude wrong / all DSA correct gives
subject scores 0/95, overall 48, mastery 21/50, and 125 XP. Replay awards zero.
Visual step completion is controller behavior, not server-verified learning;
the existing client-evaluated hackathon trust boundary remains unchanged.

## Verification and next integration

Tests cover exact phase order, missing/invalid section data, visualization
arithmetic and navigation boundaries, partial-save rejection, separate mastery,
failed-save retry, next-node gating, and duplicate protection. PGlite executes
the existing SQL migration to verify combined receipts roundtrip and forged
section claims are regraded. No hosted combined-data writes or phone UI test
were performed in this unit.

Next: receive Valli's design/background, implement the presentation for these
states, then enable the combined catalog through explicit onboarding/campaign
handling and exercise the complete flow on a phone.
