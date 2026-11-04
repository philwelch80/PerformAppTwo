import { allSessions } from './planTree'

function groupUsesExercise(group, exerciseId) {
  return group.items.some((item) => item.exerciseId === exerciseId)
}

function sessionUsesExercise(session, exerciseId) {
  if (session.type !== 'strength') return false
  return session.data.groups.some((group) => groupUsesExercise(group, exerciseId))
}

// Pure, read-only count of everywhere an exercise is referenced, for the
// archive/delete dialog. groupNames is capped for display ("3 exercise
// groups, 12 sessions — Warm-Up, Upper Pull, ...").
export function exerciseUsage(state, exerciseId) {
  const groups = state.exerciseGroups.filter((group) => groupUsesExercise(group, exerciseId))
  const sessionCount = allSessions(state.plan).filter((session) => sessionUsesExercise(session, exerciseId)).length
  const savedSessionCount = state.savedSessions.filter((session) => sessionUsesExercise(session, exerciseId)).length

  return {
    groupCount: groups.length,
    groupNames: groups.slice(0, 3).map((group) => group.name),
    sessionCount,
    savedSessionCount,
    total: groups.length + sessionCount + savedSessionCount,
  }
}

export function isExerciseInUse(state, exerciseId) {
  return exerciseUsage(state, exerciseId).total > 0
}

// Tags sorted by how many exercises use them (most-used first), for the
// filter sidebar's pills-with-counts.
export function tagCounts(exercises) {
  const counts = new Map()
  exercises.forEach((exercise) => {
    exercise.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1))
  })
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
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
