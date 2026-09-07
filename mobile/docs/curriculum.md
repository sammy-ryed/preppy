# Full 15-node backend curriculum

Implemented catalog: `data/curriculum/index.ts`, exported as `curriculumContent`.
Campaign ID: `placement-foundations-v1`, version 1. Node IDs end in
`:node-01` through `:node-15`. Each quest and question is independently versioned.

This is one shared placement curriculum for a third-year BTech CSE student,
progressing from fundamentals to multi-step problems. It is not a claim of
company-specific or previously asked interview questions.

## Counts and structure

- 15 combined nodes, with aptitude followed by DSA in every node.
- 30 explanations and 30 solved examples, each with explicit reasoning steps.
- 30 quizzes: 45 aptitude questions and 45 DSA questions (90 unique questions).
- Every question includes a hint, correct-answer explanation, and feedback for
  both wrong options. Correct option positions rotate deterministically.
- Each quiz has two process/reasoning questions and one outcome question.
- 15 configured visualizations, supported by 14 reusable algorithm trace types.
- Separate section scores and skill changes; one saved result and XP award per node.

The flow is explanation -> solved example -> quiz/feedback for aptitude, followed
by explanation -> visualization -> solved example -> quiz/feedback for DSA, then
combined result and save. Visualization next/previous/reset controls change pure
state only; no renderer, UI, animation, or autoplay was added.

| Node | Aptitude | DSA / visualization | Difficulty | Base XP |
| --- | --- | --- | --- | --- |
| 1 | Percentages | Array traversal and running total | 1 | 100 |
| 2 | Ratios/proportions | Linear search | 1 | 100 |
| 3 | Weighted averages | Prefix sums | 1 | 100 |
| 4 | Profit/loss/discounts | Binary search | 1 | 100 |
| 5 | Time/work | Bubble sort | 1 | 100 |
| 6 | Relative speed | Two-pointer pair sum | 2 | 125 |
| 7 | Simple/compound interest | Fixed sliding window | 2 | 125 |
| 8 | Remainders/cycles | Hash-map frequency counting | 2 | 125 |
| 9 | Permutations/combinations | Stack bracket matching | 2 | 125 |
| 10 | Probability | Queue/BFS layers | 2 | 125 |
| 11 | Data interpretation | Linked-list reversal | 3 | 150 |
| 12 | Inclusion-exclusion | Subset backtracking | 3 | 150 |
| 13 | Logical deductions/arrangements | BST insertion/search | 3 | 150 |
| 14 | Multi-step quantitative reasoning | Minimum-coin dynamic programming | 3 | 150 |
| 15 | Mixed aptitude assessment | BFS path reconstruction and algorithm choice | 3 | 150 |

Difficulty labels describe the curriculum stages, not a calibrated assessment.
Node 15's DSA quiz focuses on graph reasoning and compares BFS with other search
choices; it updates graphs mastery, not every previously encountered DSA skill.

## Backend integration

```ts
import { curriculumContent } from '../data/curriculum';
import { createLearningService } from '../services/learningService';
import { createSupabaseProgressRepository } from '../repositories/supabaseProgressRepository';
import { createQuestController } from '../domain/questController';

const service = createLearningService(
  curriculumContent, createSupabaseProgressRepository(supabaseClient),
);
const controller = createQuestController(
  curriculumContent, 'placement-foundations-v1',
  'placement-foundations-v1:node-01',
);
```

The application provider, onboarding catalog validation, and backend factory
must all use the same catalog when this is activated. They deliberately still
use the existing starter catalog today, so no current screen changes behavior.
Do not plug the new controller into an old-catalog save service.

Existing campaign/version IDs were preserved; no user profile or progress was
reset, migrated, or written to hosted Supabase. Existing users will need an
explicit campaign selection/migration decision during UI integration. Do not
silently mark old starter completions as completion of this new curriculum.

## Scores, skills, and progression

Weights remain 70% process, 20% outcome accuracy, 10% time. Equal evidence counts
give aptitude and DSA equal weight in the overall node score. Timing remains
untimed with the existing neutral fallback; all-correct scores 95, not 100.
Hints are recorded but do not add a new score penalty. Mastery updates each
assessed skill separately using 70% previous estimate + 30% section performance.

XP is base XP plus up to 50 from outcome accuracy. A full all-correct educational
campaign earns 2625 XP, excluding future game rewards. Retry/replay cannot earn
additional XP or mastery. Incomplete six-question attempts cannot be committed.
Save re-evaluates answer IDs rather than trusting client-provided score fields.

Nodes unlock sequentially. After 5 and 10, a game checkpoint must be explicitly
completed or skipped before 6 or 11 opens. Completing 15 unlocks finalBoss;
educational completion is separate from final game completion. All three
checkpoints are configured as skippable without game rewards for the MVP.

The game-session write service is NOT implemented in this unit. Save/progression
accepts checkpoint state already persisted by that future service. Tests simulate
checkpoint resolution using a database-owner fixture, never a production bypass.
There is no auto-skip, no fabricated game completion, and no direct app table write.
The existing JSON receipt schema supports all new skills/section scores; no SQL
migration or new dependency was necessary.

## Visualization contract

The existing hook fields and navigation actions in `combined-quest-engine.md`
remain available. `visualization.type` now identifies the algorithm. Every step
has `explanation`, immutable `values`, and immutable `state`, plus common traversal
fields (`activeIndex`, `visitedCount`, `sum`). Fields that are not meaningful for
an algorithm retain null/zero; use `state` for that algorithm's details.

| Type | State to render |
| --- | --- |
| array_traversal | Common index/visitedCount/sum fields |
| linear_search | target during comparisons; foundIndex at completion (-1 if absent) |
| prefix_sums | prefix totals, final rangeSum for indices 1..last |
| binary_search | low/high/mid during search; foundIndex at completion |
| bubble_sort | compared/swapped index pairs, sortedFrom |
| two_pointers | left/right, pairSum during comparisons, final found |
| sliding_window | left/right during windows, running sum and best |
| frequency_count | Parallel keys and counts arrays |
| brackets | text, stack, validity; activeIndex is a character index |
| bfs | edgesFrom/edgesTo, queue, distance, parent; final path and target |
| linked_list_reverse | next references (node indices), prev/current/following, final head |
| subsets | chosen values, recursion index, emitted subset count |
| bst_search | left/right child indices, insertedIndex during construction, final foundIndex |
| min_coins | dp array (null for unreachable), current amount, final minimum |

Optional state fields vary by step: render missing fields as unavailable, not as
zero. BFS adjacency is directed as authored; an undirected graph lists both edge
directions. In the BST construction trace, only indices up to insertedIndex have
been inserted. Next/previous/reset replay precomputed snapshots deterministically.

Inputs are bounded for a small educational trace (normally up to 20 elements,
six elements for subsets, target amount at most 50 for coin DP). Sorted-search
requirements, graph indices, bracket alphabets, positive coins, and other
algorithm-specific preconditions are validated before opening a quest.

## Verification

Tests check catalog counts, all outcome keys with arithmetic/reference fixtures,
full 15-node flow and hints, every visualization, invalid inputs, immutable traces,
skill seeding, and progression gates. PostgreSQL/PGlite tests save all 15 nodes,
reject partial and locked attempts, exercise simultaneous duplicate saves and
replays, roundtrip all skills/results, and preserve progress across service recreation.
Game checkpoint changes in those tests are explicitly fixtures.

No hosted full-curriculum writes or physical-device UI test were performed.
The source remains a client-evaluated hackathon learning system, not a secure exam.

## Files and ownership

Authored content: `data/curriculum/aptitude.ts`, `dsa.ts`; typed authoring helpers:
`authoring.ts`; catalog assembly and progression: `index.ts`.
Algorithms: `domain/visualizations.ts`. Expanded types/validation/controller,
skill labels, and receipt validation support the full catalog.
New tests: `tests/curriculum.test.cjs`; SQL coverage extends
`tests/supabaseProgress.test.cjs`. UI routes/components/assets and `game/` are untouched.
