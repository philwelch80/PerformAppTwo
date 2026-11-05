# Slice 1 — Data model, migration, and the Library

Status: **draft for approval.** Branch: `redesign/slice-1-library`.

## Goal

Move the prototype onto the new data model safely, and replace the exercise library and "Reusable blocks" screens with the new **Library** (Exercises, Exercise groups, Sessions) including pill-based tags and archive/delete. No plan-grid, slot, superset-rotation or styling work in this slice.

## Approach in one paragraph

First make it safe to change data (a separate state row for dev, a schema version, a migration function with tests). Then change the model once, migrate, and rebuild the Library screens on top of it. Do not touch the live `singleton` row.

## Steps

### 0. Safety rails
- Add `VITE_STATE_ROW_ID` (default `singleton`) and use it in place of the hard-coded `ROW_ID` in `StoreContext.jsx`. Add it to `.env.example`.
- Create a second row for development (copy the live row's JSON into it) and use that for local and branch deploys.
- Add `vitest` as a dev dependency (there are currently no tests) with an `npm test` script.

### 1. Schema version and migration (`src/lib/migrate.js`)
`CURRENT_VERSION = 2`. `migrate(sharedState)` returns a current-shape state from any older one (no `schemaVersion` means v1). It must be pure and idempotent. v1 → v2:

| Change | Rule |
|---|---|
| Session type `mobility` → `routines` | Rename the type; `data.items` is unchanged |
| Group gets `isSuperset` | `true` if the group has two or more items, else `false` (in v1, multi-item groups stood in for supersets) |
| Exercise gets `archived` | `false` |
| `sessionBlocks` → `exerciseGroups` | Rename; each gets `tags: []` and `isSuperset` as above |
| `savedSessions` | Same, with `mobility` → `routines` inside |
| Top level | Add `schemaVersion: 2` |

Wire it into the initial load, `HYDRATE`, and the save path (always save `schemaVersion`). **Newer-version guard:** if the loaded row's `schemaVersion` is greater than `CURRENT_VERSION`, don't save, and show a banner telling the user to reload.

Unit tests: v1 fixture (built from the current seed) migrates to the expected v2; migrating twice changes nothing; a v3 row is rejected for saving.

### 2. Reducer and helpers
- Rename actions and state: `sessionBlocks` → `exerciseGroups`, `GROUP_SAVE_AS_BLOCK` → `GROUP_SAVE_AS_GROUP` (or similar), `SESSION_BLOCK_*` → `EXERCISE_GROUP_*`, `MOBILITY_*` → `ROUTINE_*`.
- Add `EXERCISE_ARCHIVE`, `EXERCISE_RESTORE`; make `EXERCISE_DELETE` refuse an exercise that is in use.
- Add `exerciseUsage(state, exerciseId)` returning counts of groups, sessions and saved sessions that reference it, plus the names of the first few groups (pure, tested).
- Tags: add a `tagCounts(exercises)` helper (sorted by use) and a close-match helper for the "already exists" suggestion (case-insensitive, prefix or contains).
- Saving a group as an exercise group only works for groups with two or more items.

### 3. Library screens (replace `ExerciseLibrary.jsx`, `ExerciseModal.jsx`, `ReusableBlocks.jsx`)
- Nav becomes **Library** and **Plan builder** (remove "Reusable blocks"). Library has three tabs: Exercises, Exercise groups, Sessions.
- **Exercises:** same grid and filters as now, plus tag filter pills sorted by use with counts (collapse to the top few with "Show all"), and a "Show archived" checkbox.
- **Exercise edit form:** tags are toggle pills drawn from existing tags, plus a "+ New tag" pill that opens an input; while typing, show an existing close match ("Already exists: #upper"); Enter creates the tag. No free-text tag box. The delete button reads "Delete or archive…":
  - unused exercise: confirm and delete;
  - used exercise: dialog showing the usage counts, with **Archive** (default) or Cancel. ("Replace with another exercise" is **not** in this slice.)
- **Exercise groups tab:** cards with name, exercises (sets × reps), tags, a Superset badge, "used in N sessions" (best effort), Edit, and a menu (duplicate, delete). Filters: search, "contains exercise", supersets only, tags. Body area and equipment filters are hidden here.
- **Sessions tab:** saved sessions list with type filter, "Add to week", Edit, delete.
- Exercise picker (session builder) hides archived exercises. Anywhere an archived exercise is already used, show its name with an "archived" label.
- Rename the session builder's buttons and labels: "Save as exercise group", "Insert exercise group". Rename the third session type's label to **Routines**, including in `taxonomy.js` and CSS class names.

### 4. Seed and docs
- Update `seed.js` to the v2 shape (and add a couple of tags and one superset group so the demo plan shows them).
- Update `README.md`: the data model section and vocabulary.

## Not in this slice
Plan grid and slots, superset rotation UI, session quick-view panel, replace-with merge, tag rename/merge, configurable slots, restyle.

## Acceptance checks
- `npm run lint`, `npm run build` and `npm test` pass.
- Loading the dev row (still v1) migrates it in place; reloading doesn't change it again; no `mobility` remains in the saved JSON.
- An old browser tab holding v1 code cannot overwrite a v2 row.
- Creating a tag by typing "upp" offers #upper if it exists; selecting existing tags never creates duplicates.
- Archiving a used exercise hides it from the library and picker, leaves it visible (labelled) in the sessions and groups that use it, and "Show archived" brings it back and can restore it.
- Deleting an unused exercise works; deleting a used one is not possible without archiving.
- Library tabs, exercise groups and saved sessions all work against the dev row; the live site is unchanged until a deliberate deploy.

## Risks and open questions
- Migrated groups with two or more items are marked as supersets; coaches who used groups for something else will need to untick it. Worth a line in the coach message when this ships.
- The whole shared state is still one JSON row with last-write-wins. Bigger operations such as archive touch only one record, so this is acceptable for now.
- Deploying slice 1 to the live site means everyone's row gets migrated at once. Plan to do that out of hours and keep a copy of the pre-migration row.

## QA fixes already made (post-slice-1, pre-1b)

A QA pass against the deploy preview found a batch of bugs and gaps, fixed on this branch before slice 1b started — see `docs/design-decisions.md`'s "Supplement 2026-11-05" for the resulting decisions. Summary: the session/week editor self-closing on poll (HYDRATE resetting local nav state); the dev-row/live-row isolation gap in Netlify's deploy-preview env; sets/reps validation and free-text reps; the week kebab menu (actions were crowding the label); the archive dialog's title and session naming; tag hint/selection and case normalization; an accessibility sweep (dialogs, plan-tree rows as real buttons, labels, touch targets); selection highlighting only the actual target, not every ancestor; and weeks numbered by position instead of stored names. Schema moved from v2 to v5 across four small migrations. `docs/parking-lot.md` lists what was explicitly deferred.

## Slice 1b — dialogs

Goal: replace every remaining native `window.prompt`/`window.confirm` with the shared `Modal` component, and give "Save as exercise group" / "Insert exercise group" their own dialogs matching the mockups' Dialogs board, instead of a `prompt()` and a bare popover.

- **Save as exercise group** (`StrengthEditor.jsx`): a `Modal` with a required, trimmed name field (rejects a case-insensitive duplicate name inline), a preview of the exercises/sets/reps being saved, and an "Include starting weights" checkbox (already decided in `design-decisions.md` §2) — unchanged from today, it's offered only for groups with 2+ exercises.
- **Insert exercise group** (`StrengthEditor.jsx`, replacing `SessionBlockPicker`): a `Modal` listing saved groups (name, exercise/rep summary, superset badge) plus a Position choice — an index into the session's `data.groups` array (at the start / after each existing group), matching the mockup.
- **One shared `ConfirmDialog`** (built on `Modal`) for every remaining confirm: naming a saved session template, renaming/deleting plan nodes, deleting library items, the session-type switch warning, and "Reset demo data". States what's lost, with a count where possible (e.g. "Delete Week 3? This removes 4 sessions.").
- **Not in this slice:** the Add-to-week dialog's day/AM-PM grid and the archive dialog's "Replace with another exercise" — both need the day/slot data model from slice 2.

### Acceptance checks
- No `window.prompt`/`window.confirm` call remains anywhere in `src/`.
- Every dialog: Escape closes it, focus returns to the button that opened it, and a screen reader announces it as a dialog.
- Saving an exercise group with a name that already exists (any case) shows an inline error and does not save.
- Inserting an exercise group at a chosen position lands it there in the session.
- `npm run lint` and `npm run build` pass.
