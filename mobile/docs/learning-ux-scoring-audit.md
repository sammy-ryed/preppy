# Learning UX and scoring audit

Learning stages now have named color treatments: blue explanation, amber solved
example, purple visualization, pink quiz and green results. The stage trail shows
the current subject and position without letting users skip required stages.
Quiz selection is reversible until Check answer is pressed. Graded feedback keeps
the selected and correct choices visible with text labels, and avoids repeating
the same explanation twice. Existing hint, review, visualization and sound hooks
remain connected.

The results view separates correct answer counts from weighted performance,
first-save XP and gradual skill estimates. Practice results use the current
attempt's score; the server's original receipt is no longer shown as a new practice
score or new skill reward. Saving and retry states remain explicit.

Audit: all 64 correct/wrong patterns for each of the 15 nodes (960 patterns) match
independently computed scores, XP and per-subject mastery. Existing SQL integration
tests check answer regrading, forged score rejection/recalculation, sequential
unlocks, all 15 saves and duplicate reward protection. No scoring weights or SQL
migrations were changed.

Current rules: 70 points for reasoning, 20 for final-answer correctness, 10 for
pace. Questions are currently untimed, so a correct final answer gets half pace
credit. All correct therefore gives 95/100. Hints have no score penalty. First
completion XP is the node's base XP plus up to 50 from final-answer accuracy.
Mastery blends 70% previous estimate with 30% current skill performance. Replays
do not change saved XP, mastery, badge ownership or map stars. Results explain
these rules in the expandable score breakdown.

Phone checks still needed: small-screen option selection, feedback scrolling,
visualization controls, safe header spacing, and the new color treatments.
