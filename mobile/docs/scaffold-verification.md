# Scaffold verification: 2026-09-07

## Outcome

- Node 22.22.3, npm 10.9.8, Windows PowerShell.
- Expo 57.0.20, React Native 0.86.3, React 19.2.3, Router 57.0.19.
- Dependencies installed; `npm ls --depth=0` passes without invalid peers.
- TypeScript passes, including after Expo generates typed routes.
- ESLint passes with Expo's flat configuration.
- Expo dependency check: `Dependencies are up to date`.
- Expo started Metro successfully at `http://localhost:8081`.
- Android Expo Go manifest returned HTTP 200, `runtimeVersion: exposdk:57.0.0`,
  SDK 57.0.0, and `node_modules/expo-router/entry` as the entry point.
- All seven route URLs returned HTTP 200 with HTML content:
  `/`, `/onboarding`, `/map`, `/quest/preview-node`,
  `/game/preview-checkpoint`, `/skills`, `/achievements`.
- Production export passed for web, iOS, and Android. Native outputs include
  Hermes bytecode. Artifacts are in ignored `dist/`.
- HTTP responses confirm the dev server serves the route URLs, not that a browser
  rendered or clicked them. No connected browser was available through the UI tool.
- No attached phone/emulator was used. Physical Expo Go navigation is still unverified.
- No commit or push was performed. Existing `.gitkeep` deletions and the untracked
  game spritesheet were preserved. No game files were edited.
- The temporary verification server was stopped with Ctrl+C after the checks.

## Setup command record

Commands use `.cmd` because local PowerShell policy blocks `npm.ps1`/`npx.ps1`.
Except where stated, application commands ran from `mobile/`.

```powershell
# Repository/root inspection
git status --short
git branch --show-current
git diff --stat
git diff --check
git log -1 --oneline
rg --files --hidden -g '!.git' -g '!node_modules' -g '!.godot'
Get-ChildItem -Force mobile
node --version
npm --version # blocked by PowerShell; use npm.cmd
npm.cmd --version
Get-ChildItem Env:*PROXY*
npm.cmd config get registry

# Version discovery (initial sandbox calls failed EACCES)
npm.cmd view expo version
npm.cmd view expo-template-blank-typescript dist-tags --json
npm.cmd view expo version --fetch-retries=0 --fetch-timeout=15000
npm.cmd view expo-template-blank-typescript dist-tags --json --fetch-retries=0 --fetch-timeout=15000

# From repository root; registry access required sandbox escalation
npx.cmd --yes create-expo-app@latest mobile --template blank-typescript@sdk-57 --no-install --yes

# An initial npm.cmd install accidentally ran from the repository root and failed
# ENOENT because there is no root package.json. Its empty root lockfile was removed.
# The successful installation ran in mobile:
npm.cmd install
npx.cmd expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-dom react-native-web
npx.cmd expo install eslint eslint-config-expo --dev
npm.cmd ls react-native-reanimated react-native-worklets
npx.cmd expo install react-native-reanimated react-native-worklets
```

The template was inspected before removing its unused `App.tsx` and `index.ts`
entry files in favor of Router. Its `.claude/settings.json` auto-enabled an external
plugin, so that generated file was removed; `CLAUDE.md` retains the simple pointer
to the team's `AGENTS.md`. Template licensing and placeholder assets were retained.
All changes were made using file patches, not a broad directory replacement.

Additional inspection used `Get-Content` for generated configuration, ownership
files, dependency manifests, and route types; `rg --files` for the final inventory;
and `Get-ChildItem` to check that no nested Git repository was created.

One diagnostic `node -e` command lost its JavaScript quotes through PowerShell and
failed with a syntax error. Reading `bundledNativeModules.json` with
`Get-Content -Raw | ConvertFrom-Json` instead confirmed Reanimated 4.5.1 and
Worklets 0.10.1 as the SDK-compatible versions.

## Validation command record

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd ls --depth=0
npm.cmd run check:dependencies
npm.cmd audit --json
npm.cmd run export

# Local verification server; flags are session-local, not application config
$env:EXPO_OFFLINE='1'
$env:CI='1'
npm.cmd start -- --localhost --port 8081
```

`typecheck` ran again after Expo generated `.expo/types/router.d.ts` and amended
`tsconfig.json` includes. The final `lint` script runs `eslint .`, preserving Expo's
configuration. The initial `expo lint` wrapper failed because it explicitly targeted
the README-only `components/` directory, which has no lintable files yet.

The first full export compiled web but failed native bytecode generation because
the sandbox denied execution of `hermesc.exe`. The same `npm.cmd run export` command
passed with the required execution access. It exported web JavaScript plus iOS and
Android Hermes bundles. No APK/IPA or store release was built.

The Android manifest was checked with:

```powershell
$manifestResponse = Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:8081/' -Headers @{ 'expo-platform'='android'; Accept='application/expo+json' } -TimeoutSec 30
$manifestText = [System.Text.Encoding]::UTF8.GetString($manifestResponse.Content)
$manifest = $manifestText | ConvertFrom-Json
```

PowerShell returned manifest content as bytes. The first direct JSON/string
inspection therefore produced null fields/a Substring error; UTF-8 decoding
resolved the inspection error. The server itself returned HTTP 200 throughout.

Route endpoint checks used:

```powershell
$previewPaths = @('/', '/onboarding', '/map', '/quest/preview-node', '/game/preview-checkpoint', '/skills', '/achievements')
foreach ($previewPath in $previewPaths) {
  $previewResponse = Invoke-WebRequest -UseBasicParsing -Uri ('http://localhost:8081' + $previewPath) -Headers @{ Accept='text/html' } -TimeoutSec 30
  [pscustomobject]@{ route=$previewPath; status=$previewResponse.StatusCode; contentType=$previewResponse.Headers['Content-Type'] }
}
```

## Warnings and remaining limitations

- Initial registry access in the sandbox failed with `EACCES`; permitted escalated
  installs succeeded. No system execution policy was changed.
- Initial Router installation selected incompatible transitive Worklets 0.12.1.
  Explicit SDK pins resolved this: Reanimated 4.5.1 / Worklets 0.10.1.
- npm audit reports 13 moderate advisories, zero high/critical. The underlying
  reported packages include `uuid` via Expo's Xcode tooling and
  `decode-uri-component` via Router's `query-string`. npm proposes incompatible
  Expo/Router downgrades for the affected chains; no forced fix was applied.
- npm warned that transitive uuid 7.0.3 and the selected ESLint 9.39.5 are deprecated.
  ESLint remains on the Expo-compatible configuration selected by Expo installation.
- Node emitted DEP0151 for Worklets' upstream extensionless module entry.
- Metro workers emitted a `NO_COLOR`/`FORCE_COLOR` environment warning.
- Sandbox startup could not write the React Native DevTools dotslash cache; Expo
  reported using its fallback DevTools version and Metro still started successfully.
- The server also logged aborted manifest-asset resolution warnings. Exported
  assets compiled, but template icon/font display was not visually verified.
- CI mode disables reload watching for this verification session. Normal `npm start`
  is interactive and does not set CI/offline/localhost flags.
- Git could not read the global ignore file due to permissions; repository inspection
  still succeeded. The latest commit remained `841e76b`.

## Manual handoff check

Run `npm ci`, then `npm start` normally. In SDK-57-compatible Expo Go, follow
Start -> onboarding -> map -> quest -> return to map; repeat for game, skills,
and achievements. Check native Back as well. This device interaction remains to
be verified by a teammate with an attached phone.
