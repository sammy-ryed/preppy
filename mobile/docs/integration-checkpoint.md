# Integration checkpoint — 2026-09-08

## Connected

- New onboarding defaults to the 15-node curriculum. Existing starter progress
  stays separate; opening the map selects the full journey without deleting old saves.
- Valli's map uses real node/checkpoint IDs, locked states, and completion percentage.
- Quests show aptitude lesson/example/quiz/feedback, then DSA lesson/visualization/
  example/quiz/feedback, followed by committed subject scores, skill bars and XP.
- Checkpoints after nodes 5, 10 and 15 can be skipped without reward. Native game
  completion saves once and awards 50 XP for each break or 100 XP for the final boss.
- The database rejects locked checkpoints, stale sessions, and unauthenticated writes.

## Setup

1. Apply both SQL files in `supabase/migrations` in filename order. The user reported
   applying the game-session migration on September 8.
2. Run `npm ci` in `mobile` after pulling the integration (WebView is a new dependency).
3. Keep the Supabase URL/publishable key in `mobile/.env`. Add
   `EXPO_PUBLIC_GAME_URL=https://your-host/your-game.html` once the game is hosted.
4. Restart with `npx expo start --clear` after environment changes.

## Ayush handoff

The source bridge is in `game/scenes/win_screen.gd`: it reads launch parameters and
emits GAME_READY/GAME_COMPLETE through ReactNativeWebView. Pull this integration
before exporting. Existing exported PCK/HTML files do not include the new bridge.
Compile in Godot, verify web-compatible rendering, export again, and host the HTML,
JS, WASM, PCK and supporting files together on HTTPS. Share the direct HTML URL.
The bridge currently reports zero score/coins; XP is a fixed checkpoint award.
The same prototype launches for all three stage values; distinct levels are not
implemented by this integration.

## Valli handoff

Preserve `useCampaignProgress`, `useLearningQuest`, `useGameSession`, and the root
provider. Refine presentation around their real states, including visualization,
save errors/retry, and subject/skill results. Keep node/checkpoint IDs opaque.
The map artwork/styles remain hers. Home/badges placeholders and achievement
presentation are separate remaining work.

## Verification and remaining checks

Automated checks cover all 15 node saves, scoring, checkpoint gates, session
cancellation, duplicate rewards, catalog switching and malformed bridge messages.
Godot compilation and actual phone/WebView playback still require Ayush's export
and hosted URL. A successful Expo export does not verify those runtime behaviors.

On a phone: complete node 1, restart and check saved progress; reach node 5 and
skip its checkpoint to unlock node 6. Once hosted, test game launch, win, duplicate
win, exit without reward, failed load/retry and return to the map. No durable
offline queue exists; keep the result screen open and retry failed saves.
