# Block & Barbell — Coach Plan-Builder Prototype

A throwaway, coach-side-only prototype to validate the training-plan data model and core
interactions (Phase → Subphase → Block → Week → Session) before any real visual design or
backend work happens. Share the link with coaches, watch them click around, then capture what
did and didn't hang together.

**Nothing about the visual design or code here is expected to survive into the real product —
only what's learned from it.**

## What this is (and isn't)

Non-goals, carried over from the handoff spec:
- No athlete-side app or views (week view, session logging, session states/lifecycle)
- No auth or accounts — anyone with the link sees and can edit the same shared plan
- No payments, messaging, reporting/analytics, or wearable integration
- No visual design polish — functional and legible is the bar, not "on-brand"

**One deliberate deviation from the original spec:** the spec called for no backend at all
(in-memory + optional localStorage) since this was meant to be a single-coach, single-session
prototype. Since the actual goal is collecting feedback from multiple coaches, this build uses a
small Supabase backend instead, so everyone who opens the link sees the same live plan and edits
sync to everyone within ~8 seconds. There's still no auth and no per-coach data — it's one shared
plan, same as the original single-session model just made visible to more than one browser. See
[Shared backend](#shared-backend-supabase) below for what that trades away.

## Priority order

Built and worth validating in this order (per the original coach input):

1. **Exercise library** — the atomic building block everything else depends on
2. **Training plan hierarchy** — including copy-week and plan extension, both flagged as pain
   points in the original spec
3. **Session builder** — the three session types and their distinct data shapes
4. **Reusable building blocks** — saved sessions and the new "session block" concept

## Running it locally

```bash
npm install
npm run dev
```

Needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in a `.env.local` file (see
`.env.example`) pointing at the `coach-plan-builder` Supabase project. Ask whoever set up the
project for the values, or create your own project and apply the schema below.

## Shared backend (Supabase)

All shared data (exercises, the plan, saved session templates, session blocks) lives in one row
of a single table:

```sql
create table public.plan_builder_state (
  id text primary key default 'singleton',
  state jsonb not null,
  updated_at timestamptz not null default now()
);
```

RLS is enabled with permissive anon `select`/`insert`/`update` policies — intentional for a
prototype you're sharing by link, not something to carry into the real product. Anyone with the
Supabase anon key (which ships in the client bundle, as anon keys always do) can read and write
the whole shared plan.

Sync model: each browser saves its own edits ~600ms after you stop typing/clicking, and polls
every ~8s for other coaches' changes. There's no live realtime channel and no conflict
resolution — if two people edit at literally the same moment, the last save wins. Fine for
async feedback gathering; not fine for simultaneous co-editing.

Per-viewer state (which tree node is selected, which branches are expanded) stays local to each
browser and is never synced — only the plan data itself is shared.

If Supabase is unreachable, the app falls back to the built-in example data and shows a banner;
your edits still work locally, they just won't be seen by anyone else until it reconnects.

## Deploying

Static build (`npm run build` → `dist/`), deployable to Netlify or Vercel — `netlify.toml` is
included. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables on the
hosting platform (same values as `.env.local`).

## Data model

```
Exercise
  id, name, description (coaching cues), videoUrl (optional)
  movementPattern: enum        // proposed default taxonomy, flagged as such in-app
  bodyAreas: string[]          // multi-select
  equipment: enum              // Barbell / Dumbbell / Kettlebell / Machine / Cable / Bodyweight / Band / Other
  tags: string[]               // coach-managed, free-form, on top of the fields above

Plan
  name
  phases: Phase[]

Phase       { id, name, subphases: Subphase[] }
Subphase    { id, name, blocks: Block[] }
Block       { id, name, weeks: Week[] }
Week        { id, name, focus (free text), sessions: Session[] }

Session
  id, name
  type: 'strength' | 'conditioning' | 'mobility'
  data: <shape depends on type>

// strength
data.groups: Group[]
Group { id, label (optional — e.g. "Superset A"), items: Item[] }
Item  { exerciseId, sets, reps, startingWeight (optional, free text) }

// conditioning
data: { modality, description, pacing, targetType: 'hr' | 'power', targetValue }

// mobility / stretch
data.items: { label, note }[]   // ordered, low-structure — a flow, not sets/reps

SessionBlock   { id, name, items: Item[] }   // a saved bundle of exercises, one level
                                              // below a full session (e.g. a warm-up)
SavedSession   { id, name, type, data }      // a full session saved as a reusable template
```

Modeled so it doesn't preclude an athlete-side app later (session types and structure are shared
concepts), even though no athlete UI is built here.

## Assumptions to explicitly surface to coaches

Carry these into the coach conversations rather than silently deciding them — they're open
questions from the original spec:
- Whether strength sets should support a coach-prescribed starting weight at all
- Whether the movement-pattern and body-area taxonomies (see `src/lib/taxonomy.js`) are the
  right cut, or coaches think in different categories
- Whether "groups" (this prototype's stand-in for supersets/circuits) matches how coaches
  actually structure sessions

## What "done" looks like

Not a shipped feature — a set of answers from coaches on: does the Phase→Subphase→Block→Week→
Session hierarchy make sense to build a real plan in; does plan extension actually feel painless
now; is the tag system on top of the built-in exercise fields useful or redundant; and do the
three session types capture how coaches actually plan strength vs. conditioning vs. mobility
work.
