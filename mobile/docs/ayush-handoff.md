# Godot prototype review and bridge contract v1

**September 8 update:** the Expo receiver, SQL session persistence and source win
bridge are now implemented. See [current integration handoff](integration-checkpoint.md).
The review below describes the earlier prototype; touch/combat/dialogue fixes
have since been merged. A fresh web export and hosted URL are still required.

Sammy owns the Expo receiver, session persistence, rewards, and progression.
Ayush owns Godot, the web export, touch controls, and emitting game events.
This document defines the next integration; the WebView/session receiver is not
implemented yet. No files in `game/` were changed during this review.

## Findings from the merged prototype (2026-09-07)

- `Campanian.html`, `.js`, `.wasm`, `.pck`, icons and audio worklets are present.
  The WASM file is about 38 MB uncompressed. Export presence does not establish
  successful browser/phone playback or that the export matches current source.
- Both the web preset and generated HTML disable thread support.
- `project.godot` declares Godot 4.7 and Forward Plus. Verify/re-export using
  Compatibility for web. Godot's documentation says web requires Compatibility;
  the generated export has not been played during this source review.
- `mobile_controls.tscn` supplies four touch movement buttons and is instanced
  in `fa_lvl.tscn`. Attack uses `ui_accept`; interaction uses `interact` (E).
  No touch attack/interact buttons were found.
- `fa.gd` searches for `Main/DialogueBox`, but the starting scene root is `FA_lvl`
  and it does not instance `DialogueBox.tscn`. `start_viva()` returns to chase
  when no dialogue box is found. Wire the actual scene before testing dialogue.
- Player attack calls an enemy's `take_damage` only if present; `fa.gd` does not
  implement it. Decide whether combat is meant to defeat this NPC.
- No `JavaScriptBridge`, `ReactNativeWebView`, or completion message was found
  in the authored game scripts/HTML. No hosted game URL was identified.

## Contract for Ayush to implement

Expo will launch a configured HTTPS entry page with query parameters:

```text
?bridgeVersion=1&stage=break1&sessionId=<opaque-session-id>
```

Valid stages: `break1`, `break2`, `finalBoss`. Echo the exact session ID and stage
from launch. Do not send user IDs, auth tokens, Supabase keys, XP, or mastery.
Session IDs identify one launch; they are not credentials. Support standalone
browser play when launch parameters or the native bridge are absent.

The page sends JSON strings through `window.ReactNativeWebView.postMessage(...)`.
Godot can call a page helper through `JavaScriptBridge`. Add that helper using
export Head Include or a custom HTML shell so subsequent exports preserve it.
Do not hand-edit only generated `Campanian.html`.

Send ready when the scene/controls can be used:

```json
{"bridgeVersion":1,"type":"GAME_READY","sessionId":"<launch-session-id>","stage":"break1"}
```

Send completion only when the stage's actual win condition is reached:

```json
{"bridgeVersion":1,"type":"GAME_COMPLETE","sessionId":"<launch-session-id>","stage":"break1","completed":true,"score":1250,"coins":35}
```

`score` and `coins` are nonnegative integers (maximum 1,000,000 each). Use zero
when the prototype does not measure them. They describe gameplay, not an XP award.
Do not send completion merely for opening the game, dying, or closing dialogue.

For an explicit in-game exit button:

```json
{"bridgeVersion":1,"type":"GAME_EXIT","sessionId":"<launch-session-id>","stage":"break1"}
```

An exit/cancel does not count as winning or skipping. Expo owns the separate skip
action and checks whether the campaign allows it. The native close/back control
must also cancel without depending on a game message.

## Sammy's receiver requirements for the next implementation

- Launch only unlocked checkpoints and load only the configured game origin.
- Validate JSON shape, bridge version, stage, numeric limits, message length,
  and exact active session ID. Ignore unknown/invalid/stale messages.
- Keep auth in Expo; Godot never writes Supabase progress directly.
- Save completion and checkpoint rewards atomically and idempotently. Duplicate
  completion messages cannot award twice, including after a lost save response.
- Show saving/error/retry in Expo and retain the same completed payload/session
  on save retry. Navigate back only after saved completion is confirmed.
- Reloading the page retains the launch session and may emit READY again; it
  does not create another reward. A cancelled session cannot later complete.
- For MVP, leave the game on its victory state after sending completion. Expo
  owns save retry and closes the WebView on success; no ACK protocol is required.
- Treat gameplay score as client-reported, not a cheat-resistant competition.

## What Ayush should deliver next

1. A short playable stage with an explicit win condition and a completion event.
2. Working touch movement, attack/interact as needed, and readable dialogue.
3. A fresh single-threaded Compatibility web export, tested on a phone browser.
4. A direct HTTPS game URL serving the entire export directory together, preserving
   filenames (including `.wasm`, `.pck`, JavaScript, icons, and worklets).
5. READY/COMPLETE/EXIT events with the exact launch parameters above.

One prototype can serve all three stage values initially; distinct levels can
follow. Tell Sammy which win condition triggers completion. Push on Ayush's own
branch and open a PR; do not change mobile scoring or persistence.

## References

- [Godot web export requirements](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)
- [Godot JavaScriptBridge](https://docs.godotengine.org/en/stable/tutorials/platform/web/javascript_bridge.html)

Phone/browser playback, web hosting, bridge events, and Expo WebView performance
remain unverified. Source review is not a substitute for those checks.
