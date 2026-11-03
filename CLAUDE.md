# Block & Barbell — coach plan-builder prototype

A throwaway, coach-side-only prototype of a strength & conditioning training-plan builder (successor to Phil's 2010 platform, "Perform"). Shared with a handful of coaches by link to test whether the data model and core interactions hang together. **Nothing here is expected to survive into the real product — only what we learn.** Prefer simple over clever; don't build beyond what the docs describe.

Live: https://performapptwo.netlify.app (a single shared plan; no auth).

## Commands

```bash
npm install
npm run dev      # needs .env.local (see .env.example)
npm run lint
npm run build
```

Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and (after slice 1) `VITE_STATE_ROW_ID` (defaults to `singleton`; use a different value for dev/branch deploys so the live row is never touched).

## Stack and architecture

React 19 + Vite, plain JS (no TypeScript), immer, Supabase JS. No router: `App.jsx` switches screens.

- **State:** one `useReducer` store (`src/state/StoreContext.jsx`, `reducer.js`). The reducer is pure and uses immer. Add behaviour as new action types; don't mutate state elsewhere.
- **Shared slice:** only `exercises`, `plan`, `savedSessions` and the saved-groups list are shared. `selectedPath` and `expanded` are per-viewer UI state and must never be synced.
- **Sync:** the whole shared slice is one JSON row in `plan_builder_state` (id `singleton`). Saves are debounced (~600 ms); other browsers poll every ~8 s; last write wins. There is no realtime and no conflict resolution. Keep it that way.
- **Plan tree helpers:** `src/lib/planTree.js` (find/delete/clone nodes by path). Reuse them; copied weeks must get fresh ids (`cloneWeekWithFreshIds`).
- **Ids:** `uid(prefix)` from `src/lib/id.js`.
- **Seed data:** `src/lib/seed.js`; taxonomies in `src/lib/taxonomy.js` (proposed defaults, flagged in-app).
- Data is **referenced by id** (`exerciseId`), never copied, so renames propagate and archived exercises keep working.

## Domain vocabulary (use these words in code, UI and docs)

- Plan hierarchy: **Plan → Phase → Subphase → Block → Week → Session**. "Block" means only this level.
- **Exercise group:** a saved bundle of two or more exercises (e.g. a warm-up or a superset). Replaces the old name "session block"; never call it a block.
- **Group:** a set of exercises inside a session. A one-exercise group is a straight set. A group with `isSuperset: true` is performed in rotation, one set at a time (set 1 of each exercise in turn, then set 2 of each, and so on) and the UI must show that order.
- Session types: **strength**, **conditioning**, **routines**. The third type was called `mobility` in the first build; it is now `routines` everywhere.
- **Slot:** each session sits on a day and a slot (default AM / PM). Store the slot **index**, not its name.
- **Archived** exercises are hidden from the library and picker but still resolve everywhere they are used. Used exercises are never hard-deleted.

## Data changes need migrations

The live row already holds real data. Any change to the shape of the shared state must:

1. bump `schemaVersion` and add a step to `migrate()` (`src/lib/migrate.js`), run on load and on every hydrate;
2. be tested against a copy of the live state before it is deployed;
3. never be tried on the `singleton` row from a branch or local machine. Use `VITE_STATE_ROW_ID` for a separate row.

A client that loads a row with a **newer** `schemaVersion` than it understands must not save over it (show a "reload" banner instead).

## Working rules

- Work on a branch. Don't push to `main` or change the live row unless asked.
- For anything larger than a small fix, write the plan first (see `docs/`), get it approved, then build in small commits.
- Build in slices; finish and click-test one before starting the next. Current plan: `docs/slice-1-plan.md`.
- Verify in a browser (localhost) before calling a UI change done; `npm run lint` and `npm run build` must pass.
- Use real `<button>`, `<a>`, `<label>` + `<input>`; icon-only buttons need `aria-label`; touch targets at least 44 px; text contrast 4.5:1.
- Don't add features that aren't in the docs. Raise them as questions instead. Out of scope for this prototype: athlete app, auth, accounts, payments, messaging, wearables, nutrition, leaderboards.

## Docs

- `docs/design-decisions.md` — the current decisions; **wins over older specs** where they conflict.
- `docs/slice-1-plan.md` — what to build first and how to check it.
- The original spec and the first handoff spec live in the claude.ai "Training Platform" project (`original-platform-spec`, `coach-plan-builder-spec`). The README's data model predates the decisions above and is out of date in places.

## Visual reference

Screen mockups (Claude Design canvas): https://claude.ai/artifact/WiXuMtGB5zSoo7aHA5rSD8 — Library (exercises, exercise groups, sessions), plan builder (week table and weeks-as-rows grid), session builder, session quick-view panel, dialogs. Take layout, hierarchy and wording from it. Don't copy its markup, and don't treat its sample data as real. Styling is a later pass; until then the existing look is fine.
