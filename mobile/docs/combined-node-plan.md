# Revised node plan

User-approved product change: every educational node contains both aptitude and
DSA in a fixed order. This document is a plan, not a claim of implemented exports.
The current engine still supports one lesson/example and one question list.

## Required flow

1. Aptitude explanation.
2. Aptitude solved example.
3. Aptitude quiz, with feedback after each response.
4. DSA explanation.
5. DSA visualization.
6. DSA solved example.
7. DSA quiz, with feedback after each response.
8. Combined result and saved skill changes/XP, then return to the map.

Complete both quizzes before node completion, XP, achievement evaluation, or next
node unlock. A wrong answer still allows progression after feedback. No separate
reward for finishing just the aptitude half. Keep the 5/10/15 game checkpoints.

## Next implementation unit: combined quest engine

- Add ordered aptitude/DSA sections to quest content. Each section references
  its lesson, example, and quiz; the DSA section references a visualization.
  Keep one node ID, quest attempt ID, and final save for the whole experience.
- Extend the controller/view with the current section, section progress, and
  visualization data. Reuse lesson/example/question/feedback presentation phases
  where possible. Keep `useLearningQuest(nodeId)` as the connected entry point;
  publish the new fields in the UI contract after implementation.
- Validate the exact section order, referenced content, question uniqueness,
  visualization inputs, and skill evidence. Reject partial/foreign attempts at save.
- Author one complete demo node first: percentages aptitude plus arrays DSA.
  Suggested quiz size: three short questions per section, two process/reasoning
  and one outcome, all assessing that section's chosen skill.
- Retain scoring weights 70% process / 20% outcome accuracy / 10% timing. Grade
  each skill from its own questions; do not blend DSA answers into aptitude mastery.
  Equal question/evidence counts per section keep the initial node balanced.
  Show aptitude and DSA performance plus before/after mastery separately. Preserve
  the untimed fallback until active timing is implemented.
- Reuse the atomic completion service/repository with all questions from both
  sections. Award XP once and retain duplicate-save protection. Update validation,
  controller, scoring coverage, save tests, and application tests together.
- Version the changed content. Preserve the old starter campaign for existing
  progress; introduce the combined demo under a new campaign ID rather than
  relabelling existing completed nodes as completion of the new curriculum.
  Explicit campaign switching/migration for already-onboarded users must be handled
  before replacing their selected campaign. Do not reset live progress silently.

## Work alongside Valli

Valli builds the map using `useCampaignProgress`: opaque IDs, order, status,
current node, XP, and checkpoints. Every node represents both subjects; do not
style nodes as mutually exclusive aptitude-versus-DSA types. The current two-node
catalog is real data; a 15-position design preview must remain an isolated fixture
until the full curriculum exists.

Sammy can build the engine and visualization steps before receiving the background.
When the map is done, Valli supplies the node-screen background asset plus a Figma
frame showing content bounds, safe areas, text/button styles, and any overlays.
Sammy builds reusable learning/visualization renderers within that design, using
one quest route rather than separate screens for every node. Valli owns final
layout and visual polish. Confirm background fit/crop and asset path at handoff.

After one combined node works end to end, extend the content to the remaining
nodes/company paths, then integrate achievement cards and Godot checkpoints.
Ayush continues the game/bridge work using `ayush-handoff.md` independently.

## Git checkpoint

The latest hosted-verification script and handoff docs are currently local changes.
Commit those intended files before merging the newly updated `origin/main` into
`feat/learning-backend-sammy`. Do not overwrite the working tree or discard files.
Valli should update her own clean branch from main before starting map work.

## Environment troubleshooting for Valli

The specific missing-URL/key message is thrown locally before network access.
It does not mean anonymous sign-in or the SQL migration failed. This shared hosted
project already passed the live smoke test on Sammy's checkout.

1. Put the file in `mobile/.env`, alongside `mobile/package.json`. Check Windows
   has not named it `.env.txt`. Use the exact keys from `.env.example`.
2. Stop Expo, start from `mobile/`, and run `npm.cmd start -- --clear`. Fully reload
   Expo Go/browser and connect to this terminal's dev server, not an older one.
3. If still broken, inspect `.env.local`, `.env.development`, and
   `.env.development.local` for empty/conflicting overrides. Check whether shell
   environment values override the files. Do not print keys in shared logs.
4. Ensure `EXPO_NO_DOTENV` and `EXPO_NO_CLIENT_ENV_VARS` are not set to `1`.
5. Share filenames, whether Expo reports loading/exporting the variable names,
   and whether both values are populated, without sharing the values themselves.

The existing `lib/supabase.ts` uses Expo's supported static
`process.env.EXPO_PUBLIC_...` references; no app.json wiring or new dotenv package
is needed for this setup.

[Expo environment-variable documentation](https://docs.expo.dev/guides/environment-variables/)
