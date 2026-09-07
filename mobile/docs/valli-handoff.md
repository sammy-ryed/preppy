# Valli handoff checkpoint

The shared hooks are ready for UI integration. Routes remain visual placeholders.
Read [the implemented UI contract](ui-contract.md) first.

## Push Sammy's checkpoint now

Run from the repository root after reviewing changes. These are instructions;
the implementation agent has not committed or pushed.

```powershell
git branch --show-current
git status --short
git add mobile supabase
git diff --cached --name-only
git commit -m "feat(learning): add quest engine and persisted progress hooks"
git push -u origin feat/learning-backend-sammy
```

The branch should be `feat/learning-backend-sammy`. Review the staged list before
committing; `.env` must not appear. Share `.env.example` only. This includes the
preceding domain/backend tasks and the new connected hooks. No game files are added.

Open a PR from `feat/learning-backend-sammy` to `main`. After review and merge,
Valli should commit her working changes on `valli`, then update:

```powershell
git fetch origin
git switch valli
git merge origin/main
cd mobile
npm.cmd ci
npm.cmd run typecheck
npm.cmd run lint
```

Resolve shared-file conflicts preserving both UI/navigation and the provider.
Do not replace whole folders or blindly choose one side of conflicts.

## Message to copy to Valli

> The learning backend/hooks are ready on `feat/learning-backend-sammy`.
> After its PR merges, update `valli` from `main`. Read
> `mobile/docs/ui-contract.md`. Use `useOnboarding`, `useCampaignProgress`,
> `useLearningQuest`, and `useSkills`; preserve `LearningProvider` in `_layout.tsx`.
> Wire your Figma UI to those hooks, including loading, locked, saving, and retry
> states. Current content is two starter array quests. Push your latest UI to
> `valli` and open a PR to `main` so we can review the integration.

## Receive Valli's code

On 2026-09-07 a read-only remote check found `refs/heads/valli` at
`0ec64ec62761d3f7180e0de8522f7255436591c2`. Contents were not inspected, so this
cannot establish whether her latest local work has been pushed.

After she pushes, review the PR before merging. Commit this checkpoint first so
integration does not mix with uncommitted backend work. Review routes, provider,
dependencies/configuration, hook imports, and native styles. Preserve Ayush's
`game/`. Run checks and exercise the combined UI against Supabase before merging.

## Validation and setup

66 tests, TypeScript, ESLint, and Android/iOS/web production exports passed.
SQL tests run the migration in PGlite with simulated Supabase auth roles.
Hosted Supabase and a physical-device journey have not been verified.

Follow [backend setup](backend-setup.md): populate `mobile/.env`, enable anonymous
sign-ins, apply the migration, restart Expo. On the integrated UI, verify
onboarding -> node 1 -> saved XP/skills -> unlocked node 2 -> restart/restoration.
Disconnect during save and retry; rewards must not duplicate.

```powershell
cd mobile
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check:dependencies
npm.cmd run export
```

New provider/hook-task files: `types/application.ts`, `domain/onboarding.ts`,
`services/learningApplication.ts`, `providers/LearningProvider.tsx`,
`hooks/useOnboarding.ts`, `hooks/useCampaignProgress.ts`, `hooks/useSkills.ts`,
`hooks/useLearningQuest.ts`, `tests/learningApplication.test.cjs`, and this document.
Updated: `services/backend.ts`, `app/_layout.tsx`, `tsconfig.domain.json`,
`README.md`, `AGENTS.md`, and UI/backend/quest docs.
