# PREPPY mobile foundation

Shared Expo SDK 57 / React Native / TypeScript / Expo Router application.
All screens remain temporary navigation placeholders. Domain scoring, the quest
controller, Supabase save services, and connected hooks are implemented separately
from presentation. The root layout mounts the shared learning provider.
See [backend setup](docs/backend-setup.md) to connect your Supabase project.
The hosted smoke test is available as `npm run verify:backend` (read-only) or
`npm run verify:backend -- --write` (creates test users/progress). See the setup doc
for its verified behavior and limits. [Ayush's handoff](docs/ayush-handoff.md)
records the prototype review and the next Godot bridge contract.

## Run

Use Node.js 22.13+ (Node 22 LTS recommended) and npm. From the repository root:

```sh
cd mobile
npm ci
npm start
```

Open the QR code with an Expo Go version that supports SDK 57. Keep the phone and
computer on the same network. `npm run android` opens a connected Android device
or emulator; `npm run ios` requires the iOS simulator on macOS. A physical iPhone
can connect with Expo Go without a local iOS build. `npm run web` opens the browser
preview; web preview is not a substitute for a native device check.

On Windows PowerShell, if execution policy blocks `npm.ps1` or `npx.ps1`, use
`npm.cmd` and `npx.cmd` instead. No policy change is necessary.

## Checks

```sh
npm run typecheck
npm test
npm run lint
npm run check:dependencies
npm run export
```

`export` compiles Android, iOS, and web bundles to ignored `dist/`. It does not
build an APK/IPA, publish the app, or establish that Expo Go was tested on a phone.
Expo generates ignored `.expo/` route types and `expo-env.d.ts` during development.

## Routes

| URL | File | Temporary behavior |
| --- | --- | --- |
| `/` | `app/index.tsx` | Opening screen; Start links to onboarding |
| `/onboarding` | `app/onboarding.tsx` | Onboarding placeholder; link to map |
| `/map` | `app/map.tsx` | Links to every remaining screen |
| `/quest/:nodeId` | `app/quest/[nodeId].tsx` | Displays the provided node ID |
| `/game/:checkpointId` | `app/game/[checkpointId].tsx` | Displays the provided checkpoint ID |
| `/skills` | `app/skills.tsx` | Skills placeholder |
| `/achievements` | `app/achievements.tsx` | Achievement placeholder |

`_layout.tsx` supplies a plain stack and default headers. Preview IDs are opaque
routing examples, not real campaign configuration. Map links do not unlock content.

## Valli's starting point

Read `AGENTS.md` and `docs/ui-contract.md`. Replace placeholder presentation using
your Figma/Stitch work while preserving the routes and their parameter names.
Reusable visuals belong in `components/ui/`; create `components/screens/` if useful.
The template PNGs in `assets/` are not PREPPY branding. Replace them as designs land.
Use the implemented onboarding, campaign, saved quest, and skills hooks. Do not
access Supabase directly from UI. See [the handoff instructions](docs/valli-handoff.md)
for branch coordination and the implemented API contract.

## Structure grows with implementation

Only currently useful folders are tracked. Sammy's implemented code lives in
`data/`, `domain/`, `services/`, `repositories/`, `hooks/`, `providers/`, `lib/`, and `types/`.
Godot integration and learning/visualization renderers will be added
when needed. See `AGENTS.md` for ownership boundaries.
The repository's `game/` remains Ayush-owned.

## Dependencies

Expo and Router provide the runtime/navigation foundation. Safe-area context and
screens support native navigation; linking/constants/status-bar are Expo Router
setup dependencies. React DOM and React Native Web enable Valli's browser preview.
Router brings in Reanimated and Worklets transitively; explicit Expo-compatible
pins prevent npm from selecting versions incompatible with Expo Go. The scaffold
adds no animation behavior. TypeScript and Expo's ESLint configuration provide checks.
Supabase, AsyncStorage, and the URL polyfill support authentication/persistence.
PGlite is development-only and runs migration/RLS tests in embedded PostgreSQL;
it is not imported into the app.

Use `npx expo install <package>` for SDK dependencies and retain `package-lock.json`.
Do not run forced dependency upgrades merely to silence transitive audit warnings.
See `docs/scaffold-verification.md` for the implementation command record and results.
