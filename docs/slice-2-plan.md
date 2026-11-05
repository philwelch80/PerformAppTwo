# Slice 2 — Plan overview (season strip, block grid, quick-view panel)

Status: **draft; open questions 1–7 answered 2026-11-05 (see Decisions below); items under "Still open" need an answer before slice 2b is built.** Branch: `redesign/slice-1-library`.

> **Version note:** the brief that asked for this plan said "the schemaVersion 3 migration step." That's stale — the slice-1 QA-fix pass already moved the schema from v2 to v5 (reps as text, tag normalization, position-numbered weeks). The day/slot migration below is **v5 → v6**.

## Goal

Replace the plan tree as the primary way to see a plan with the mockups' overview: a season strip, a weeks-as-rows block grid with days as columns and AM/PM cells, and a 420px session quick-view panel — without losing the tree (it becomes "Outline" view, for structural edits). See `docs/mockups/PlanOverview.png` and `PlanOverviewPanel.png`.

## Approach in one paragraph

Three slices, in dependency order: first the grid's layout and navigation using only data that already exists (no migration, so it's reviewable immediately); then the day/slot data model and the migration that makes the grid actually placeable; then the quick-view panel, which depends on sessions already being addressable by day/slot. Each slice is independently shippable and click-testable.

## Slice 2a — Grid shell, no schema change

Builds the visual structure using the current data model. Every session in a week is shown in one list per week row (no day columns yet) — this slice is about the shell, not placement.

- **Plan builder** gains an **Outline / Grid** toggle. Outline is the existing tree + detail panel, unchanged. Grid is new.
- **Season strip:** one row across the top, one bar per week, grouped/labelled by phase. Click a week to scroll the grid to it. Load bars are a flat placeholder (see Open questions — the metric isn't defined yet).
- **Block grid:** weeks as rows, grouped under collapsible block headers (phase › subphase context, week range, session count). **Blocks are collapsed by default except the current block**, defined as the first block that isn't fully in the past — see Open questions, since there's no plan start date to compute "current" from yet, so for this slice "current" means **the first block**, period.
- **"Add week at end"** — same as today's "+ Add week" on the last block, relabelled/relocated to match the mockup.
- View mode (Outline/Grid) and which blocks are collapsed are **per-viewer UI state**, not shared — same treatment as `selectedPath`/`expanded` today (see "State" below).

### Reuse
- `planTree.js`: `getPhase`/`getSub`/`getBlock`/`getWeek`, `allSessions`, `weekName`. No new reducer actions needed — this slice only reads the existing shape and adds local component state for view mode and collapsed blocks.

### Acceptance checks
- Switching Outline ↔ Grid doesn't lose the current selection or scroll position unreasonably.
- The season strip's week count matches the tree's week count exactly.
- Collapsing/expanding a block is instant and doesn't touch the shared slice (verify no save fires).
- `npm run lint` and `npm run build` pass.

## Slice 2b — Day/slot data model + migration

Adds real placement so the grid's columns mean something.

- **Data model:** each session gains `day` (0–6, Monday–Sunday) and `slot` (an **index** into the plan's day-slots list, per CLAUDE.md's domain vocabulary — never a name). Plan gains `daySlots: ['AM', 'PM']` (fixed for this slice; the configurable-slots editor stays parked). A session with `day`/`slot` both `null` is **unscheduled**.
- **Migration (v5 → v6):** every existing session gets `day: null, slot: null` — i.e. **everything starts unscheduled**, nothing is auto-placed onto a day. See Open questions for why this is the proposed default instead of guessing a day.
- **Unscheduled area:** a visible row (or panel) per week — probably above or below that week's day columns — listing sessions with no day/slot, so nothing silently disappears after migration. A coach drags (or otherwise assigns) a session from there onto a day/slot cell.
- **Grid becomes real:** each week row's cells are keyed by `(day, slot)`; a session renders in its cell instead of the placeholder single list from 2a.
- **New reducer action:** `SESSION_SCHEDULE_UPDATE` (path, day, slot) — the only state change this slice needs beyond the migration itself.
- **Drag to move a session** between cells (or into/out of "unscheduled") — this is slice 2's version of the already-parked **S2** finding (drag-and-drop needs a manual test pass, not just automated browser verification); flag it the same way here.
- **Newer-version guard:** unchanged mechanism — `isNewerThanSupported` already rejects saving over a row with a higher `schemaVersion` than the running client understands; this slice doesn't change that logic, only adds one more version step for it to guard.
- **Test plan:** before merging, run `migrate()` against a copy of the live `singleton` row's current JSON (fetched read-only) and confirm every session ends up `day: null, slot: null`, the migration is idempotent, and it doesn't mutate its input — same discipline as the v2–v5 migrations already shipped. Never try it against `singleton` itself; use `VITE_STATE_ROW_ID=dev`.

### Reuse
- `planTree.js`'s session-walking pattern (as used by `migrate.js`'s `walkPlanSessions`) for the migration step.

### Acceptance checks
- Loading a dev-row copy of the live data (still v5) migrates cleanly to v6; reloading doesn't change it again.
- Every pre-existing session appears in "Unscheduled," not silently dropped and not guessed onto a day.
- Assigning a session a day/slot moves it into the matching grid cell; clearing it moves it back to Unscheduled.
- `npm run lint`, `npm run build` and `npm test` pass, including a new migration test fixture.

## Slice 2c — Session quick-view panel

- Clicking a session (in Grid view) opens a **420px right-hand panel**: name, type, day + slot (dropdowns, using `SESSION_SCHEDULE_UPDATE`), groups/exercises, superset rotation line. Quick edits: sets, reps, starting weight, name, day, slot — the same `GROUP_ITEM_UPDATE`-style actions used today, not new ones.
- Actions: **Open full editor** (switches to the existing full `SessionBuilder`), **Duplicate**, **Save as template** (reuses `SESSION_SAVE_AS_TEMPLATE`), **Delete** (reuses the `ConfirmDialog` pattern from slice 1b, with a count where one makes sense).
- Structural edits (add/reorder exercises or groups, toggle superset) are explicitly **not** in the panel — "Open full editor" is the only way to reach them, same as the mockup.
- Panel-open state (which session, if any) is **per-viewer**, not shared.
- Responsive: on wide screens the grid narrows to make room; on narrow screens the panel overlays and the selected session scrolls into view, outlined.

### Acceptance checks
- Opening the panel never changes `selectedPath` in a way that affects another viewer (it's local).
- A quick edit in the panel and the same field in the full editor stay in sync (same dispatch, same store).
- Deleting a session from the panel closes the panel and removes it from the grid.
- `npm run lint` and `npm run build` pass.

## State (shared vs per-viewer)

Shared (synced, part of the JSON row): `day`/`slot` on each session, `daySlots` on the plan.
Per-viewer only (never synced, same rule as `selectedPath`/`expanded` today): Outline/Grid view mode, which blocks are collapsed, the quick-view panel's open/closed state and which session it shows, season-strip scroll position.

## Not in this slice

- Configurable day slots (more than AM/PM, custom names/order) — stays parked.
- Replace-with-another-exercise merge — stays parked (slice 1's `ExerciseUsageDialog` already notes this).
- Load-bar polish beyond the metric in `docs/definitions.md` (no per-exercise load, no tonnage).
- Mobile master-detail layout for the grid (parking lot **V6**) — the grid gets the same responsive narrowing as the quick-view panel, nothing more.
- A dedicated multi-session cell design beyond stacking (see Decisions, item 3).

## Decisions (Phil, 2026-11-05)

1. **"Current" block follows a plan start date.** Every plan has a **mandatory start date**, set when the plan is created. If the start date is in the future, the first block is the one that loads and counts as current. Otherwise "current" is the first block that isn't fully in the past, computed from today's date. Slice 2a keeps "first block" until the start date exists (slice 2b).
2. **Migration places nothing:** every existing session becomes unscheduled (`day: null, slot: null`). Confirmed.
3. **Several sessions per cell are allowed, but it is the exception.** Design for one card per cell; when a second one lands in the same cell, stack them inside the cell (no blocking, no warning). `SESSION_SCHEDULE_UPDATE` does not reject occupied cells.
4. **The "+" in an empty cell creates a new session** on that day and slot, with a default start time: **9:00 for AM, 15:00 for PM** (by slot index). The insert-saved-session picker is not offered from "+" for now.
5. **Plan start date is mandatory** (see 1).
6. **Inserting an exercise group copies it**, which is fine for individual plans. Linked groups and team plans are a future question (parking lot).
7. **Load metric: session RPE × duration.** Defined on the definitions page (`docs/definitions.md`) so reviewers can read it and comment. The season strip stays a flat placeholder until the metric's data fields exist.

## More decisions (Phil, 2026-11-05, second round)

8. **Session start time is editable and shown.** `startTime` ("HH:MM", null while unscheduled) appears on the grid card and can be changed in the quick-view panel and the full editor. Slot still decides which cell a session sits in; changing the time does not move it to another slot.
9. **The live plan gets its start date in the migration, and it is a Monday.** The v5 → v6 step sets `plan.startDate` (ISO date, always a Monday). Proposed value: **Monday 2026-11-09** (the next Monday), editable afterwards in a plan settings control. Any new plan created later must ask for a start date, snapped to the Monday of the date chosen. The grid's columns are Mon–Sun, so week 1 always starts on a Monday.
10. **Planned RPE and planned duration are added now** as optional session fields: `plannedRpe` (1–10, or null) and `plannedMinutes` (whole minutes, or null), included in the same v5 → v6 migration (both null for existing sessions). They are editable in the quick-view panel and the full editor. The season strip's load bars use them as defined in `docs/definitions.md` (week load = sum of RPE × minutes; sessions missing either count 0 and the week shows a "load incomplete" mark). Bars stay flat only for weeks where no session has both fields.

Migration summary (v5 → v6): `plan.startDate` (Monday), `plan.daySlots = ['AM','PM']`, and on every session `day`, `slot`, `startTime`, `plannedRpe`, `plannedMinutes` all null. One migration, one test fixture against a copy of the live row on `dev`; never `singleton`.

## Parked from this round
- Team plans and linked exercise groups (decision 6): parking lot.
