# Parking lot

Findings from the slice-1 QA review that are explicitly out of scope for now — not built, just noted here so they aren't lost. See `docs/slice-1-plan.md` for what's actually in slice 1.

| ID | What it is | Status |
|---|---|---|
| V6 | Mobile master-detail layout for the plan tree + detail panel (currently a two-column layout that just stacks under 760px). | |
| V7 | Undo/history for edits — there's no undo anywhere in the app today. A confirm dialog is the only safety net. | |
| V9 | Superset rotation UI — the data model already marks a group `isSuperset`, but nothing in the session builder shows or edits the set-by-set rotation order. Planned for a later slice. | |
| V13 | A single, shared dialog system. | **Done** (slice 1b): every overlay dialog is the shared `Modal`, plus one `ConfirmDialog`/`PromptDialog` pair for every remaining confirm/rename/naming flow — no native `window.prompt`/`window.confirm` left in the app. `ExerciseModal`'s inline right-hand panel is still a different shape by design (it's the mockup's edit panel, not a confirm/prompt), not an oversight. |
| V15 | Normalized tables instead of one JSON blob per plan — out of scope for this prototype; see CLAUDE.md's "Sync" section. | |
| V17 | No detail given in the QA pass this parking lot was written from — ask for the finding text before scoping it. | |
| V19 | No detail given in the QA pass this parking lot was written from — ask for the finding text before scoping it. | |
| V21 | A real load/tempo/rest model for strength sets — today there's only `startingWeight` (free text) alongside sets/reps. | |
| S2 | Drag-and-drop reordering (weeks, sessions, routine items) needs a manual test pass — it can't be verified by the automated browser tooling used for this round of fixes. | |
| S3 | Concurrent-edit handling — the app is explicitly last-write-wins with no conflict resolution (see CLAUDE.md's "Sync" section); a real merge/locking story is out of scope. | |
| S5 | Contrast measurement — CLAUDE.md requires 4.5:1 text contrast but nothing here has actually measured the current palette against it. | |
| S6 | Large-plan performance — untested with a plan of realistic size (many phases/weeks/sessions); the tree and sync payload are both O(whole plan). | |

## Missing, for a coach to actually use this

- A list of plans — right now there's exactly one shared plan with no way to create, switch between, or archive others.
- Athletes/clients — no concept of who a plan is for, or assigning plans to people.
- Configurable slots — AM/PM is hardcoded; no way to add more slots per day or rename them.
- Bulk edit — no way to apply a change (e.g. a load bump, a rep-scheme swap) across many sessions/weeks at once.
- Print / export — no printable or exportable view of a plan or a single session.
