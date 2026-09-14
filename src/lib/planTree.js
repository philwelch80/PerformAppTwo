import { uid } from './id'

export function getPhase(plan, id) {
  return plan.phases.find((p) => p.id === id)
}
export function getSub(phase, id) {
  return phase.subphases.find((s) => s.id === id)
}
export function getBlock(sub, id) {
  return sub.blocks.find((b) => b.id === id)
}
export function getWeek(block, id) {
  return block.weeks.find((w) => w.id === id)
}
export function getSession(week, id) {
  return week.sessions.find((s) => s.id === id)
}

// Resolves any prefix of a selection path against a plan, stopping at the
// first missing ancestor (so a stale selection after a delete degrades
// gracefully instead of throwing).
export function locatePath(plan, path) {
  if (!path) return {}
  const phase = path.phaseId ? getPhase(plan, path.phaseId) : null
  const sub = phase && path.subId ? getSub(phase, path.subId) : null
  const block = sub && path.blockId ? getBlock(sub, path.blockId) : null
  const week = block && path.weekId ? getWeek(block, path.weekId) : null
  const session = week && path.sessionId ? getSession(week, path.sessionId) : null
  return { phase, sub, block, week, session }
}

export function resolveNode(plan, kind, parts) {
  const phase = getPhase(plan, parts[0])
  if (kind === 'phase') return phase
  const sub = getSub(phase, parts[1])
  if (kind === 'sub') return sub
  const block = getBlock(sub, parts[2])
  if (kind === 'block') return block
  const week = getWeek(block, parts[3])
  if (kind === 'week') return week
  if (kind === 'session') return getSession(week, parts[4])
  return undefined
}

export function deleteNode(plan, kind, parts) {
  if (kind === 'phase') {
    plan.phases = plan.phases.filter((x) => x.id !== parts[0])
  } else if (kind === 'sub') {
    const phase = getPhase(plan, parts[0])
    phase.subphases = phase.subphases.filter((x) => x.id !== parts[1])
  } else if (kind === 'block') {
    const sub = getSub(getPhase(plan, parts[0]), parts[1])
    sub.blocks = sub.blocks.filter((x) => x.id !== parts[2])
  } else if (kind === 'week') {
    const block = getBlock(getSub(getPhase(plan, parts[0]), parts[1]), parts[2])
    block.weeks = block.weeks.filter((x) => x.id !== parts[3])
  } else if (kind === 'session') {
    const week = getWeek(getBlock(getSub(getPhase(plan, parts[0]), parts[1]), parts[2]), parts[3])
    week.sessions = week.sessions.filter((x) => x.id !== parts[4])
  }
}

// Deep-clones a week and assigns fresh ids to it and everything under it,
// so a copied week is fully independent of its source.
export function cloneWeekWithFreshIds(week) {
  const copy = JSON.parse(JSON.stringify(week))
  copy.id = uid('week')
  copy.sessions.forEach((session) => {
    session.id = uid('sess')
    if (session.data?.groups) {
      session.data.groups.forEach((g) => {
        g.id = uid('grp')
      })
    }
  })
  return copy
}

export function moveWithinArray(array, fromId, toId) {
  const fromIdx = array.findIndex((x) => x.id === fromId)
  const toIdx = array.findIndex((x) => x.id === toId)
  if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return
  const [moved] = array.splice(fromIdx, 1)
  const insertAt = array.findIndex((x) => x.id === toId)
  array.splice(insertAt, 0, moved)
}
