# Slice 2 — Plan overview (season strip, block grid, quick-view panel)

Status: **draft for approval — do not build any of this yet.** Branch: `redesign/slice-1-library`.

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
- A real load metric for the season strip (bars are a flat placeholder until one is defined).
- Mobile master-detail layout for the grid (parking lot **V6**) — the grid gets the same responsive narrowing as the quick-view panel, nothing more.
- Multiple sessions sharing one day/slot cell (see Open questions).

## Open questions for Phil

1. **"Current" block/week** — there's no plan start date in the data model, so "current" can only mean "first" by position in 2a. Do we add a plan-level start date (and from it, today-relative "current") in slice 2, or leave "current" meaning "first" for this slice and revisit?
2. **Default placement on migration** — this plan proposes **everything becomes unscheduled** (`day: null, slot: null`) rather than guessing a day, specifically to avoid collisions (if every legacy session defaulted to, say, Monday/AM, they'd all pile into one cell). Confirm that's the right call, or would you rather see a different default (e.g. spread across weekdays in session order)?
3. **One session per cell, or many?** The mockup's grid shows exactly one card per day/slot. Is a second session in the same cell a blocked action, or does it need to stack/scroll within the cell? This changes `SESSION_SCHEDULE_UPDATE`'s validation.
4. **Empty "+" cells** — the mockup shows a `+` in every open cell. Does clicking it create a brand-new session pre-filled with that day/slot (today's "+ Add session" flow), open the "insert saved session" picker pre-filled with that day/slot, or offer both? This affects whether slice 2b or 2c owns that interaction.
5. **Load bars** — confirmed placeholder (flat) for slice 2a per `design-decisions.md` §5. Is defining the actual metric (total sets? session RPE × duration?) in scope for a slice 2 follow-up, or staying parked indefinitely?
