# Definitions

For reviewers: terms as the prototype uses them, and the one metric still being defined. Comment on anything that doesn't match how you work.

## Plan structure
| Term | Meaning |
|---|---|
| Plan | One training program, with a mandatory start date |
| Phase | A major period of the plan (e.g. Accumulation, Intensification, Peak) |
| Subphase | A subdivision of a phase (e.g. General prep) |
| Block | A run of weeks inside a subphase (usually 3–5). "Block" means only this level |
| Week | One row of the grid, numbered by position, with an optional focus note |
| Session | One workout on a day and a slot |
| Slot | A part of the day. Default AM and PM; stored as an index so renaming never orphans sessions |
| Unscheduled | A session with no day and slot yet |

## Session content
| Term | Meaning |
|---|---|
| Session types | Strength, Conditioning, Routines (mobility, warm-ups, stretching) |
| Group | A set of exercises inside a session. One exercise = a straight set |
| Superset | A group performed in rotation, one set at a time: set 1 of each exercise in turn, then set 2 of each, and so on |
| Exercise group | A saved bundle of two or more exercises in the Library. Inserting one adds a copy; editing the copy never changes the saved group |
| Archived exercise | Hidden from the library and picker, still shown wherever it is already used |

## Training load (decided, being built in slice 2)

**Session load = session RPE × duration in minutes**, in arbitrary units (AU).
- *Session RPE:* how hard the whole session is meant to feel, 1–10.
- *Duration:* planned session length in minutes.
- Example: RPE 7 for 60 minutes = 420 AU.

**Week load** = the sum of its sessions' loads. The season strip draws one bar per week, scaled to the heaviest week in the plan.

**What this needs.** Each session has an optional planned RPE and planned duration (added in slice 2). A session missing either counts as 0 and the week shows a "load incomplete" mark rather than a misleading low bar. Weeks where no session has both stay flat.

**Questions for reviewers**
1. Is session RPE × duration how you think about load? If not, what do you use (total sets, tonnage, volume load, something else)?
2. Do you plan RPE per session, or per exercise?
3. For strength sessions, would you rather see sets × reps × load than RPE × duration?
4. Should conditioning and strength loads be added together or shown separately?
