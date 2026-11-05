import { allSessions } from './planTree'

function groupUsesExercise(group, exerciseId) {
  return group.items.some((item) => item.exerciseId === exerciseId)
}

function sessionUsesExercise(session, exerciseId) {
  if (session.type !== 'strength') return false
  return session.data.groups.some((group) => groupUsesExercise(group, exerciseId))
}

// Pure, read-only count of everywhere an exercise is referenced, for the
// archive/delete dialog. groupNames/sessionNames are capped for display
// ("3 exercise groups (Warm-Up, ...), 12 sessions (Lower A, ...)").
export function exerciseUsage(state, exerciseId) {
  const groups = state.exerciseGroups.filter((group) => groupUsesExercise(group, exerciseId))
  const planSessions = allSessions(state.plan).filter((session) => sessionUsesExercise(session, exerciseId))
  const savedSessions = state.savedSessions.filter((session) => sessionUsesExercise(session, exerciseId))
  const sessionNames = [...planSessions, ...savedSessions].slice(0, 3).map((session) => session.name)

  return {
    groupCount: groups.length,
    groupNames: groups.slice(0, 3).map((group) => group.name),
    sessionCount: planSessions.length,
    savedSessionCount: savedSessions.length,
    sessionNames,
    total: groups.length + planSessions.length + savedSessions.length,
  }
}

export function isExerciseInUse(state, exerciseId) {
  return exerciseUsage(state, exerciseId).total > 0
}

// Tags sorted by how many items (exercises, or exercise groups) use them
// (most-used first), for a tab's filter pills-with-counts.
export function tagCounts(items) {
  const counts = new Map()
  items.forEach((item) => {
    item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
  })
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

// Exercises and exercise groups share one tag vocabulary, so the "+ New
// tag" pill in either edit form offers every tag used anywhere.
export function allTagNames(state) {
  const set = new Set()
  state.exercises.forEach((e) => e.tags.forEach((t) => set.add(t)))
  state.exerciseGroups.forEach((g) => g.tags.forEach((t) => set.add(t)))
  return [...set].sort((a, b) => a.localeCompare(b))
}

// For the "+ New tag" input's "Already exists: #upper" suggestion —
// case-insensitive, preferring a prefix match over a mere substring match.
export function findCloseTag(existingTags, input) {
  const needle = input.trim().toLowerCase()
  if (!needle) return null
  const prefixMatch = existingTags.find((tag) => tag.toLowerCase().startsWith(needle))
  if (prefixMatch) return prefixMatch
  return existingTags.find((tag) => tag.toLowerCase().includes(needle)) || null
}

// Best-effort "used in N sessions" for an exercise group's card: inserting a
// group into a session COPIES its items (see design-decisions.md "Linked vs
// copied exercise groups" open item), so there's no stored back-reference —
// this matches plan sessions whose group label equals the saved group's
// name, which only catches unedited, unrenamed copies.
export function exerciseGroupUsageCount(state, exerciseGroup) {
  return allSessions(state.plan).filter(
    (session) => session.type === 'strength' && session.data.groups.some((g) => g.label === exerciseGroup.name),
  ).length
}
