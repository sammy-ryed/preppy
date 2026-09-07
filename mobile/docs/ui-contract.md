# PREPPY UI integration direction

Valli owns the visual implementation. Her Figma design is the visual source of
truth, with Stitch assisting translation. Build native React Native presentation;
browser HTML/CSS output is not directly interchangeable with native components.

Sammy will provide domain-friendly hooks and objects. UI must not access Supabase
directly or implement its own scoring, XP, mastery, or progression rules.

**The examples below are contract directions, not final types or implemented
hooks. Do not import them yet.** Use isolated presentation fixtures if needed,
clearly marked as temporary, and replace those fixtures with the actual hooks later.

## Expected hook shapes

```ts
useOnboarding()
// submit({ name, dsaLevel, aptitudeLevel, companyId })
// Level direction: "beginner" | "intermediate" | "advanced".

useCampaignProgress()
// { campaign, xp, nodes, checkpoints, currentNodeId, loading, error }
// Node status: "locked" | "available" | "completed".
// IDs are opaque strings. currentNodeId may be null at a checkpoint or completion.

useQuest(nodeId)
// { phase, lesson, visualization, question, feedback, result,
//   submitting, error, submitAnswer(answer), next(), retrySave() }

useSkills()
// { skills: [{ id, label, mastery, evidenceCount }] }

useGameSession(checkpointId)
// { status, launch(), cancel(), skip(), retry(), error }
```

Loading, errors, empty states, and pending saves need presentation. Do not show
committed XP/unlocks just because a button was tapped. Completion services will
return the saved result. Prevent repeated submission while saving and offer retry.

## Journey and learning behavior

- Target: 15 educational nodes per company campaign.
- Node 5 -> game break 1; node 10 -> game break 2; node 15 -> final game/boss.
- These are campaign configuration, not conditions to scatter through screens.
- Node statuses and the current node are derived by domain logic. UI renders them.
- Intended quest flow: lesson -> visualization where applicable -> worked example
  -> challenge -> feedback -> result -> XP/skill update -> achievement evaluation
  -> progression. Content can omit optional learning sections.
- Game checkpoints may be explicitly skipped without a game reward. Cancelling
  the current session is different from skipping the checkpoint.
- The current scaffold's sample links bypass all of this solely to test routes.

## Scores, skills, and cards

- Scoring direction: 70% process/reasoning evidence, 20% outcome accuracy, 10% time.
  Process and outcome questions are separately assessed; no double-counting.
- Mastery remains between 0 and 100 and updates gradually. Initial self-assessment
  is an estimate; evidenceCount helps communicate how much assessment supports it.
- XP measures engagement/progression and is separate from mastery.
- Achievement cards are separate from both. Initial candidates: First Quest,
  Perfect Run, Five Quests, and Boss Scholar.
- Domain logic supplies achievement identifiers/metadata, not card layouts or assets.

## Bimbo and presentation

Presentation may map `success`, `failure`, `perfect`, `achievement`, `game_unlock`,
and `boss_complete` events to Bimbo poses/animations. Domain services must not
contain Bimbo image paths. Valli controls all visuals and motion.

## Files and coordination

- `app/` contains shared thin routes. Inspect and preserve current behavior before edits.
- Put reusable UI in `components/ui/`; add `components/screens/` when useful.
- Sammy's future logic folders and shared types are listed in `AGENTS.md`.
- If a hook does not provide what a screen needs, inspect its contract first and
  prefer a presentation adapter. Coordinate necessary shared-interface changes.
- `../game/` belongs to Ayush and is outside mobile UI work.
