import { normalizeTag } from './exercises'

// v1 (no schemaVersion) -> v2: mobility -> routines, sessionBlocks ->
// exerciseGroups (+ tags, isSuperset), groups get isSuperset, exercises get
// archived. See docs/slice-1-plan.md step 1 for the full table.
// v2 -> v3: reps becomes free text ("8", "8-10", "AMRAP", "5/3/1") instead
// of a coerced number (V3).
// v3 -> v4: tags are normalized to lowercase-hyphenated, merging duplicates
// that only differed by case (V14).
// v4 -> v5: a week's stored `name` is dropped — its display name is always
// derived from position ("Week N"); a custom label goes in `focus` (V8).
// v5 -> v6: plan gains `startDate` (a Monday) and `daySlots`; every session
// in the plan gains `day`, `slot`, `startTime`, `plannedRpe`, `plannedMinutes`
// (all null — everything starts unscheduled). See docs/slice-2-plan.md
// decisions 2, 9, 10.
export const CURRENT_VERSION = 6

export function isNewerThanSupported(sharedState) {
  return (sharedState?.schemaVersion || 1) > CURRENT_VERSION
}

function migrateSession(session) {
  if (session.type === 'mobility') session.type = 'routines'
  if (session.data?.groups) {
    session.data.groups.forEach((group) => {
      if (typeof group.isSuperset !== 'boolean') {
        group.isSuperset = group.items.length >= 2
      }
    })
  }
}

function walkPlanSessions(plan, fn) {
  plan.phases.forEach((phase) =>
    phase.subphases.forEach((sub) =>
      sub.blocks.forEach((block) => block.weeks.forEach((week) => week.sessions.forEach(fn))),
    ),
  )
}

function v1ToV2(state) {
  walkPlanSessions(state.plan, migrateSession)
  state.savedSessions.forEach(migrateSession)

  state.exercises.forEach((exercise) => {
    if (typeof exercise.archived !== 'boolean') exercise.archived = false
  })

  state.exerciseGroups = (state.sessionBlocks || []).map((block) => ({
    id: block.id,
    name: block.name,
    items: block.items,
    tags: block.tags || [],
    isSuperset: block.items.length >= 2,
  }))
  delete state.sessionBlocks

  state.schemaVersion = 2
  return state
}

function stringifyReps(items) {
  items.forEach((item) => {
    if (typeof item.reps !== 'string') item.reps = String(item.reps)
  })
}

function v2ToV3(state) {
  state.exerciseGroups.forEach((group) => stringifyReps(group.items))
  walkPlanSessions(state.plan, (session) => {
    if (session.data?.groups) session.data.groups.forEach((group) => stringifyReps(group.items))
  })
  state.savedSessions.forEach((session) => {
    if (session.data?.groups) session.data.groups.forEach((group) => stringifyReps(group.items))
  })

  state.schemaVersion = 3
  return state
}

function dedupeTags(tags) {
  return [...new Set(tags.map(normalizeTag))]
}

function v3ToV4(state) {
  state.exercises.forEach((exercise) => {
    exercise.tags = dedupeTags(exercise.tags)
  })
  state.exerciseGroups.forEach((group) => {
    group.tags = dedupeTags(group.tags)
  })

  state.schemaVersion = 4
  return state
}

function v4ToV5(state) {
  state.plan.phases.forEach((phase) =>
    phase.subphases.forEach((sub) =>
      sub.blocks.forEach((block) => block.weeks.forEach((week) => delete week.name)),
    ),
  )

  state.schemaVersion = 5
  return state
}

function v5ToV6(state) {
  state.plan.startDate = '2026-11-09'
  state.plan.daySlots = ['AM', 'PM']

  walkPlanSessions(state.plan, (session) => {
    session.day = null
    session.slot = null
    session.startTime = null
    session.plannedRpe = null
    session.plannedMinutes = null
  })

  state.schemaVersion = CURRENT_VERSION
  return state
}

// Pure and idempotent: returns a current-shape state from any older one.
// A state newer than CURRENT_VERSION is returned unchanged — the caller
// must not save over it (see isNewerThanSupported).
export function migrate(sharedState) {
  const version = sharedState?.schemaVersion || 1
  if (version > CURRENT_VERSION) return sharedState

  let state = structuredClone(sharedState)
  if (version < 2) state = v1ToV2(state)
  if (state.schemaVersion < 3) state = v2ToV3(state)
  if (state.schemaVersion < 4) state = v3ToV4(state)
  if (state.schemaVersion < 5) state = v4ToV5(state)
  if (state.schemaVersion < 6) state = v5ToV6(state)
  return state
}
