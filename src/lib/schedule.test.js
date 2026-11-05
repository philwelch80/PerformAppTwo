import { describe, expect, it } from 'vitest'
import { addDays, currentBlockIndex, defaultStartTimeForSlot, mondayOf, weekLoad } from './schedule'

describe('mondayOf', () => {
  it('leaves a Monday unchanged', () => {
    expect(mondayOf('2026-11-09')).toBe('2026-11-09')
  })
  it('snaps a mid-week date back to that week\'s Monday', () => {
    expect(mondayOf('2026-11-12')).toBe('2026-11-09') // Thursday
  })
  it('snaps a Sunday back to the Monday that started its week', () => {
    expect(mondayOf('2026-11-15')).toBe('2026-11-09')
  })
  it('crosses a month boundary correctly', () => {
    expect(mondayOf('2026-12-01')).toBe('2026-11-30') // Tuesday
  })
})

describe('addDays', () => {
  it('adds days within a month', () => {
    expect(addDays('2026-11-09', 6)).toBe('2026-11-15')
  })
  it('crosses a month boundary', () => {
    expect(addDays('2026-11-28', 4)).toBe('2026-12-02')
  })
  it('accepts negative offsets', () => {
    expect(addDays('2026-11-09', -1)).toBe('2026-11-08')
  })
})

describe('defaultStartTimeForSlot', () => {
  it('is 9:00 for slot 0 (AM)', () => {
    expect(defaultStartTimeForSlot(0)).toBe('09:00')
  })
  it('is 15:00 for slot 1 (PM)', () => {
    expect(defaultStartTimeForSlot(1)).toBe('15:00')
  })
})

describe('currentBlockIndex', () => {
  const blocks = [{ weeks: [1, 2, 3, 4] }, { weeks: [1, 2, 3, 4] }, { weeks: [1, 2] }]

  it('is the first block when the start date is in the future', () => {
    expect(currentBlockIndex(blocks, '2099-01-05', '2026-11-05')).toBe(0)
  })
  it('is the first block on the start date itself', () => {
    expect(currentBlockIndex(blocks, '2026-11-09', '2026-11-09')).toBe(0)
  })
  it('is the second block once the first block\'s weeks are in the past', () => {
    // Block 1 spans weeks 1-4 = 2026-11-09 .. 2026-12-06 (28 days)
    expect(currentBlockIndex(blocks, '2026-11-09', '2026-12-07')).toBe(1)
  })
  it('falls back to the last block once the whole plan is in the past', () => {
    expect(currentBlockIndex(blocks, '2026-11-09', '2027-06-01')).toBe(2)
  })
  it('is the first block when there is no start date yet', () => {
    expect(currentBlockIndex(blocks, null, '2026-11-05')).toBe(0)
  })
  it('is 0 for an empty plan', () => {
    expect(currentBlockIndex([], '2026-11-09', '2026-11-05')).toBe(0)
  })
})

describe('weekLoad', () => {
  it('is flat when no session has both a planned RPE and planned minutes', () => {
    const week = { sessions: [{ plannedRpe: null, plannedMinutes: 60 }, { plannedRpe: 7, plannedMinutes: null }] }
    expect(weekLoad(week)).toEqual({ total: 0, state: 'flat' })
  })
  it('is flat for a week with no sessions', () => {
    expect(weekLoad({ sessions: [] })).toEqual({ total: 0, state: 'flat' })
  })
  it('sums RPE x minutes across complete sessions', () => {
    const week = { sessions: [{ plannedRpe: 7, plannedMinutes: 60 }, { plannedRpe: 5, plannedMinutes: 40 }] }
    expect(weekLoad(week)).toEqual({ total: 7 * 60 + 5 * 40, state: 'complete' })
  })
  it('is incomplete when some but not all sessions have both fields', () => {
    const week = { sessions: [{ plannedRpe: 7, plannedMinutes: 60 }, { plannedRpe: null, plannedMinutes: null }] }
    expect(weekLoad(week)).toEqual({ total: 420, state: 'incomplete' })
  })
})
