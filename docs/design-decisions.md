# Design Decisions — Coach Plan-Builder (2026-11-03)

Decisions made while mocking up the coach-side prototype. Where this conflicts with the original platform spec or the first coach plan-builder handoff spec (both in the claude.ai "Training Platform" project), **this doc wins**.

Mockups: Claude Design canvas "Coach Plan-Builder — Screen Mockups" (https://claude.ai/artifact/WiXuMtGB5zSoo7aHA5rSD8).

## 1. Naming

- **Exercise group** replaces "session block" (the spec's reusable bundle of exercises). "Block" is already the plan hierarchy level (Phase → Subphase → Block → Week → Session).
- Third session type is **Routines** (not Mobility / Stretch & Mobility). The repo still says `mobility`.
- Supersets: exercises alternate one set at a time. Needs an `isSuperset` flag on groups and a visible rotation in the UI.

## 2. Library (replaces the separate "Reusable blocks" screen)

One top-level **Library** with three tabs, mirroring exercise → group → session:

| Tab | Contents | Filters |
|---|---|---|
| Exercises | Single exercises | search, body area, equipment, tags, show archived |
| Exercise groups | Saved bundles of 2+ exercises (may be a superset) | search, "contains exercise", supersets only, tags |
| Sessions | Whole saved sessions ("Add to week") | search, session type |

- Nav is two items: **Library** and **Plan builder**.
- Offer "Save as exercise group" only for groups with two or more exercises.
- Inserting a group into a session **copies** it; editing the copy doesn't change the saved group. (Open: do coaches want linked groups?)
- Starting weights are included when saving a group by default (checkbox to exclude).
- Hypothesis to test: do coaches use exercise groups at all? If not, cut the tab.

## 3. Tags

- Tags are chosen by tapping **pills** of existing tags, not by typing free text.
- "+ New tag" opens a small input; as the coach types, a close existing match is suggested ("Already exists: #upper") before creating a new one.
- Sidebar filter shows tags sorted by usage with counts; collapses to the top few with "Show all" once there are many.
- Same tag vocabulary for exercises and exercise groups. Future: rename/merge tags.

## 4. Deleting an exercise

Exercises are referenced by id from groups, sessions and (later) athlete history, so deletion never silently changes them.

- **Unused:** can be deleted permanently (confirmation).
- **Used:** cannot simply be deleted. Dialog shows usage ("3 exercise groups, 12 sessions") and offers **Archive** (default: hidden from library and picker; existing groups/sessions/history keep working and show the name; restorable via "Show archived") or **Replace with another exercise** (swaps it everywhere, then archives it; for merging duplicates).
- Never auto-remove an exercise from a group or session.
- Data model: `Exercise.archived: boolean`; groups and sessions store `exerciseId` references, not copies.

## 5. Plan views

The nested tree stays for structure editing but is no longer the main way to see time. (A tree shows order and containment, not rhythm; the 2010 table grew wider with every week.)

- **Season strip** (top): one bar across the whole plan with phase bands, weekly load bars and week numbers. Stays one screen wide at any plan length. Click to jump.
- **Block grid** (main): **weeks are rows, days are columns** (Mon–Sun), so longer plans scroll vertically. Rows are grouped under Block headers (with Phase › Subphase context). **Blocks are collapsed by default; the current/first block is open.** Collapsed headers show week range and session count.
- **Week detail:** single-week table (days across, slots down).
- Drag a session to any day, slot or week; copy week = duplicate a row; extend = "Add week at end". Outline / Grid toggle switches views.
- Load bars are placeholder; define the metric first (e.g. total sets, or session RPE × duration).
- Phase/block header colours must not reuse the session-type colours; use a neutral scale.

## 6. Day slots (AM / PM)

- Each session has a **day** and a **slot**. Default slots: AM / PM; one session per slot cell in the week table.
- Plan-level setting "Day slots": AM / PM, or Morning / Afternoon / Evening (ordered list, default `["AM","PM"]`). Not in the first build; ship fixed AM / PM.
- Sessions store the **slot index**, not its name.
- Open rule: reducing slots is blocked until the removed slot is empty, or the coach chooses where its sessions go.

## 7. Session quick-view panel

Clicking a session in the plan grid opens a **right-hand slide-in panel** (~420 px) instead of navigating away or expanding below the table.

- Read-first: name, type, day + slot (dropdowns), groups and exercises, superset rotation line.
- Quick edits: sets, reps, starting weight, name, day, slot. Actions: Open full editor, Duplicate, Save as template, Delete.
- Structural edits (add/reorder exercises or groups, supersets) stay in the full session builder.
- Body switches by session type. On wide screens the grid narrows to fit; on narrow screens the panel overlays and the selected session scrolls into view; the selected session is outlined.

## 8. Dialogs

Save as exercise group · Insert exercise group (search, pick, position) · Add saved session to a week (week, day, slot picker) · Remove exercise (archive / replace).

## 9. Visual style

**Decided 2026-11-05: match the mockups.** Teal accent `#0B6B5D` (darker `#0B4F44`, soft `#DCEBE8`); dark header `#101418`; page background `#F3F5F4`; surfaces white; borders `#DDE2E0` / `#C3CBC9`; secondary text `#44504E` and `#5B6563` (darkened from the mockups' `#6B7775`, which fell under 4.5:1 on the page background — see §S5 in `parking-lot.md`). Font is Inter Tight (400/500/600/700), replacing IBM Plex Sans/Mono. The amber/IBM Plex look the first build shipped with is replaced; a warmer old-PerformApp palette was compared earlier and not chosen. Images are in `docs/mockups/` (see its README).

- **Dark mode:** dropped for the prototype (the mockups are light only; there's no theme toggle). The `prefers-color-scheme` block is removed rather than left half-styled.
- **Numbers:** tabular numerals are kept globally for sets, reps and load via `font-variant-numeric: tabular-nums` (Inter Tight supports it; no second/mono font needed).
- **Session-type colors** (soft tint + dark text, always paired with the S/C/R letter, never color alone): strength bg `#DCEBE8` / text `#0B4F44`; conditioning bg `#E3E8F6` / text `#1F3A7A`; routines bg `#F3E6D8` / text `#7A3E0F`. Strength's tokens (`--strength`/`--strength-soft`) are kept separate from the brand accent tokens (`--accent`/`--accent-soft`) even though the values currently match, so the two can diverge later without re-coupling session-type color to brand color.
- **Phase/subphase/block bands** (outline tree and the plan grid) stay a neutral scale, never session-type tints — this overrides what the PlanOverview/PlanBuilder mockup images show (their block headers are tinted by phase); §5 above already called this out and nothing here changes it.
- Accessibility rules in CLAUDE.md still win over the mockups (44px targets, 4.5:1 text contrast — measured, not assumed; see §S5 in `parking-lot.md`).

## 10. Open items

- Rename `mobility` → `routines`; add `slot`, `isSuperset`, `archived` to the data model; migrate existing shared data (see `slice-1-plan.md`).
- Conditioning body for the quick-view panel.
- Linked vs copied exercise groups.
- Load metric for the season strip.

## Supplement 2026-11-05

Decisions made while fixing slice-1 QA findings, not yet reflected above.

- **Dev row:** `VITE_STATE_ROW_ID` (default `singleton`) isolates local/preview work from the live plan. A "Dev data: `<id>`" banner shows whenever the row isn't `singleton`. "Reset demo data" always confirms first, naming what's lost, and lives in the footer rather than the main toolbar.
- **Sync never resets local navigation:** `HYDRATE` replaces only the shared slice (exercises, plan, savedSessions, exerciseGroups). It never resets `selectedPath` or `expanded` — those are per-viewer state and are only cleared/merged when the node they reference is actually gone or new.
- **Sets / reps:** sets is a required integer 1–99 (empty while typing is fine; invalid values show an inline error and are never silently coerced). Reps is free text — `8`, `8-10`, `AMRAP`, `5/3/1` are all valid; it's not validated against a fixed pattern.
- **Tags:** stored lowercase-hyphenated. Typing a close match to an existing tag shows "Already exists: #tag"; pressing Enter only selects the existing tag on an exact (case-insensitive) match — anything else creates a new, normalized tag rather than silently substituting a near match.
- **Weeks are numbered by position**, not stored by name. Copying, reordering or deleting a week can never leave a stale or colliding name behind. A custom label still goes in the week's free-text `focus` field. Block names stay free text, coach-maintained; deriving a block's week range automatically was considered and not chosen.
- **Dialogs:** every dialog is the shared `Modal` component (focus trap, Escape to close, `role="dialog"`, `aria-modal`, focus returned to the trigger on close), plus one shared `ConfirmDialog` variant for yes/no confirmations that states what will be lost, with a count where possible. Native `window.prompt`/`window.confirm` are gone from the app. **V13 (a single dialog system) is un-parked** — this is it. Undo is still parked; a confirm is the only safety net.
- **Day slots and "Replace with another exercise" remain later slices** — nothing in slice 1b adds them, even where the mockups' dialog board shows them (Add-to-week's day/slot grid, the archive dialog's "Replace with…" option).
- **Plan overview (season strip, block grid, quick-view panel) is slice 2** — planned before it's built; see `slice-2-plan.md`.

## Supplement 2026-11-05 (plan overview answers)

- **Plan start date is mandatory.** A future start date means the first block loads as "current"; otherwise current = the block containing today.
- **Several sessions can share a day/slot cell** (the exception, so stack them). The "+" in an empty cell creates a new session with a default start time: 9:00 for AM, 15:00 for PM.
- **Existing sessions migrate to unscheduled** (`day: null, slot: null`).
- **Exercise groups are inserted as copies**, fine for individual plans; team plans and linked groups are a future question.
- **Load metric is session RPE × duration**, defined in `docs/definitions.md`. The season strip stays a flat placeholder until planned RPE and duration exist on sessions.
- Open: start time editable or not, how the live plan gets its start date, planned RPE/duration fields (see `slice-2-plan.md`, "Still open").
