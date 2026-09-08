# Badges

The five badges are derived by `domain/badges.ts` from saved node receipts and
completed game checkpoints. No migration or additional XP award is needed.

- First solved: one saved learning node.
- Zero mistakes: all answers in both sections of a saved combined node are correct.
  Hints and time do not disqualify it. Partial answers do not qualify.
- Regions 1, 2, 3: saved wins for break1, break2, finalBoss respectively.
  Active, cancelled and skipped checkpoints do not qualify.

`/badges` and `/achievements` display the same collection, including locked hints.
The shared header keeps its yellow card stack, adds a star when a badge is earned,
and displays a collected count alongside it. Full artwork stays in the collection.
The full supplied PNG is displayed with its original aspect ratio, including its
illustrative stat numbers. Those printed numbers do not modify player skill values.

The root `BadgeUnlocks` provider queues earned, unacknowledged badges and opens the
`/badge-unlock` transparent-modal route once navigation is ready on a learning screen.
It waits until leaving a game route to avoid covering gameplay. Acknowledgements are stored
in AsyncStorage per user/campaign; refreshes do not repeat dismissed notifications.
Each acknowledgement includes the run's first saved attempt ID and completion time,
not just the badge ID. Clearing database progress and earning again therefore
creates new notifications even when the phone retains its old AsyncStorage data.
Later nodes and ordinary replays retain the original run identity. Old badge-ID-only
acknowledgements cannot suppress receipt-based notifications.
Previously earned badges also get a first celebration when this feature is opened.
The v2 acknowledgement cache requeues existing badges once after the popup update.
Collected cards can be tapped to replay their celebration without changing rewards
or acknowledgement state. Automatic and manual celebrations use the same route,
with a fixed footer and a full PNG sized to the available screen height. Closing
advances the in-memory queue immediately, without waiting for device storage.
Clearing device storage or switching devices can show the celebrations again;
ownership still comes from backend progress. If acknowledgement storage fails,
dismissal works for the current session.

Device check: complete a flawless node to see two consecutive pop-ups; dismiss,
relaunch, and check the collection/header. Win a checkpoint and return to the map
to see the region celebration. Skipping a different checkpoint must leave its badge locked.
