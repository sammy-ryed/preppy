# PREPPY mobile: team ownership and agent instructions

This is the shared Expo / React Native / TypeScript / Expo Router foundation.
Read current files before changing them. Expo SDK 57 documentation:
https://docs.expo.dev/versions/v57.0.0/

## Valli owns presentation

- `components/ui/`, `components/screens/` when created, visual styling in routes,
  mobile UI assets, typography, buttons, cards, layouts, animations, and Bimbo presentation.
- Valli's Figma design is the visual source of truth; her Stitch output supports
  implementation. Translate browser-only output to React Native where necessary.
- Other agents must not independently redesign her screens or introduce an unrelated
  design system. Preserve her existing presentation and behavior.
- Current route content and Expo template artwork are temporary placeholders, not design guidance.

## Sammy owns educational and application logic

- `data/`, `domain/`, `services/`, `repositories/`, `hooks/`, `providers/`, `lib/`,
  `integrations/`, `types/`, learning logic, and visualization algorithm/state logic.
- Keep these areas independent of visual styling. Learning and visualization
  components connect Sammy's behavior to Valli's presentation.
- Agents working on UI must not rewrite scoring, progression, XP, database logic,
  or question data, casually change schemas/interfaces, insert database calls into
  UI components, or duplicate Sammy's hooks/services in local screen logic.
- If UI needs different data: inspect the existing hook/type/service, reuse it,
  add a presentation adapter/view-model if needed, and change a shared interface
  only when necessary. Preserve backward compatibility where practical.

## Ayush owns the game

The repository's sibling `../game/` directory is Ayush-owned. Mobile agents must
not edit it unless explicitly asked. Godot integration will eventually live in
`integrations/godot/`; it is not part of this scaffold.

## Shared integration files

- `app/` routes, especially `_layout.tsx`, are shared integration points.
- Before editing a route, inspect current code, preserve existing behavior, avoid
  replacing teammate implementation, and make the smallest necessary change.
- Dependency manifests and app configuration are shared. Add packages only when
  the current task needs them and preserve Expo Go compatibility.
- Route files should remain thin. Do not put scoring, progression, or persistence there.
- Temporary navigation links do not represent unlocked content or real user progress.

## Product constraints for future work

- Read `docs/ui-contract.md` before integrating UI and domain behavior.
- The intended journey has 15 educational nodes, with configured game checkpoints
  after nodes 5, 10, and 15. Derive node statuses; do not maintain unlock rules in UI.
- Scoring direction: 70% separate process/reasoning evidence, 20% outcome accuracy,
  10% time. Do not count the same answer in both evidence buckets.
- Mastery is 0-100. XP, mastery, and achievement cards are separate concepts.
- Domain events are semantic (for example `success`, `failure`, `perfect`,
  `achievement`, `game_unlock`, `boss_complete`). Map events to Bimbo assets in
  presentation; never put image paths in scoring or progression services.
- The UI contract documents implemented hooks and explicitly marks future APIs.

## Work discipline

- Never clean up working teammate code merely because you would implement it differently.
- No broad hackathon refactors without explicit approval. Preserve ownership boundaries.
- Create future folders when real code needs them; do not add fake implementations.
- Use small changes. Run `npm run typecheck`, `npm run lint`, and appropriate Expo
  compilation checks. Report commands, failures, and untested device behavior honestly.
- Do not commit or push unless explicitly instructed.
