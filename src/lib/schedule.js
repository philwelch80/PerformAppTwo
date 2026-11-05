// Day/slot grid helpers: plan-start-date math and the season strip's load
// metric. Dates are always "YYYY-MM-DD" strings, compared lexicographically
// (which sorts correctly for ISO dates) and manipulated in UTC so local
// timezone/DST never shifts a calendar date by a day.

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function parseISODate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}
function formatISODate(date) {
  return date.toISOString().slice(0, 10)
}

// Snaps any date to the Monday of its (Monday-start) week.
export function mondayOf(dateStr) {
  const d = parseISODate(dateStr)
  const day = d.getUTCDay() // 0 = Sunday ... 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return formatISODate(d)
}

export function addDays(dateStr, days) {
  const d = parseISODate(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return formatISODate(d)
}

// Local calendar date (not UTC "now") — what day it is for the coach
// looking at their screen.
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function defaultStartTimeForSlot(slot) {
  return slot === 0 ? '09:00' : '15:00'
}

// The index of the "current" block: if the plan's start date is in the
// future, that's the first block; otherwise it's the first block that
// isn't fully in the past yet (by its last week's Sunday). If the whole
// plan is in the past, falls back to the last block rather than leaving
// nothing open. `blocks` is an array of { weeks: [...] } in plan order.
export function currentBlockIndex(blocks, startDate, today = todayISO()) {
  if (!blocks.length) return 0
  if (!startDate || startDate > today) return 0
  let weeksSoFar = 0
  for (let i = 0; i < blocks.length; i++) {
    weeksSoFar += blocks[i].weeks.length
    const blockEndDate = addDays(startDate, weeksSoFar * 7 - 1)
    if (blockEndDate >= today) return i
  }
  return blocks.length - 1
}

// Session load = planned RPE x planned minutes; a session missing either
// doesn't count toward the total. Week load = sum of its sessions' loads.
// `state` distinguishes "no data at all yet" (flat placeholder) from "some
// sessions still missing a field" (a real bar, but marked incomplete).
export function weekLoad(week) {
  const sessions = week.sessions
  const complete = sessions.filter((s) => s.plannedRpe != null && s.plannedMinutes != null)
  if (complete.length === 0) return { total: 0, state: 'flat' }
  const total = complete.reduce((sum, s) => sum + s.plannedRpe * s.plannedMinutes, 0)
  return { total, state: complete.length < sessions.length ? 'incomplete' : 'complete' }
}
