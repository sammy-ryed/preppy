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
Artwork is clipped above its illustrative stats so baked-in numbers never appear
as the user's skill results.

The root `BadgeUnlocks` component queues earned, unacknowledged badges. It waits
until leaving a game route to avoid covering gameplay. Acknowledgements are stored
in AsyncStorage per user/campaign; refreshes do not repeat dismissed notifications.
Previously earned badges also get a first celebration when this feature is opened.
Clearing device storage or switching devices can show the celebrations again;
ownership still comes from backend progress. If acknowledgement storage fails,
dismissal works for the current session.

Device check: complete a flawless node to see two consecutive pop-ups; dismiss,
relaunch, and check the collection/header. Win a checkpoint and return to the map
to see the region celebration. Skipping a different checkpoint must leave its badge locked.
