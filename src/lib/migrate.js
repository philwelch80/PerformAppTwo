// v1 (no schemaVersion) -> v2: mobility -> routines, sessionBlocks ->
// exerciseGroups (+ tags, isSuperset), groups get isSuperset, exercises get
// archived. See docs/slice-1-plan.md step 1 for the full table.
export const CURRENT_VERSION = 2

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

  state.schemaVersion = CURRENT_VERSION
  return state
}

// Pure and idempotent: returns a current-shape state from any older one.
// A state newer than CURRENT_VERSION is returned unchanged — the caller
// must not save over it (see isNewerThanSupported).
export function migrate(sharedState) {
  const version = sharedState?.schemaVersion || 1
  if (version > CURRENT_VERSION) return sharedState

  const state = structuredClone(sharedState)
  if (version < 2) return v1ToV2(state)
  return state
}
