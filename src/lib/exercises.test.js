import { describe, it, expect } from 'vitest'
import { exerciseUsage, isExerciseInUse, tagCounts, allTagNames, findCloseTag, exerciseGroupUsageCount } from './exercises'
import { migrate } from './migrate'
import { freshState } from './seed'

function stateWithGroupsAndSessions() {
  const state = migrate(freshState())
  const squatId = state.exercises.find((e) => e.name === 'Back Squat').id
  const carryId = state.exercises.find((e) => e.name === "Farmer's Carry").id

  state.exerciseGroups.push({ id: 'xg-1', name: 'Warm-Up', items: [{ exerciseId: squatId, sets: 2, reps: 5, startingWeight: '' }], tags: [], isSuperset: false })
  state.exerciseGroups.push({ id: 'xg-2', name: 'Finisher', items: [{ exerciseId: squatId, sets: 1, reps: 3, startingWeight: '' }], tags: [], isSuperset: false })
  state.savedSessions.push({
    id: 'tpl-1',
    name: 'Saved Lower',
    type: 'strength',
    data: { groups: [{ id: 'grp-1', label: '', items: [{ exerciseId: squatId, sets: 3, reps: 5, startingWeight: '' }], isSuperset: false }] },
  })

  return { state, squatId, carryId }
}

describe('exerciseUsage', () => {
  it('counts groups, plan sessions and saved sessions that reference the exercise', () => {
    const { state, squatId } = stateWithGroupsAndSessions()
    const usage = exerciseUsage(state, squatId)
    expect(usage.groupCount).toBe(2)
    expect(usage.groupNames).toEqual(['Warm-Up', 'Finisher'])
    expect(usage.sessionCount).toBe(1) // only the seeded "Lower A" session uses Back Squat
    expect(usage.savedSessionCount).toBe(1)
    expect(usage.total).toBe(usage.groupCount + usage.sessionCount + usage.savedSessionCount)
  })

  it('returns all zeros for an exercise that is not referenced anywhere', () => {
    const { state, carryId } = stateWithGroupsAndSessions()
    const usage = exerciseUsage(state, carryId)
    expect(usage).toEqual({ groupCount: 0, groupNames: [], sessionCount: 0, savedSessionCount: 0, sessionNames: [], total: 0 })
  })

  it('names the first few plan and saved sessions that use the exercise', () => {
    const { state, squatId } = stateWithGroupsAndSessions()
    const usage = exerciseUsage(state, squatId)
    expect(usage.sessionNames).toEqual(['Lower A', 'Saved Lower'])
  })

  it('caps groupNames at the first three groups', () => {
    const { state, squatId } = stateWithGroupsAndSessions()
    state.exerciseGroups.push({ id: 'xg-3', name: 'Third', items: [{ exerciseId: squatId, sets: 1, reps: 1, startingWeight: '' }], tags: [], isSuperset: false })
    state.exerciseGroups.push({ id: 'xg-4', name: 'Fourth', items: [{ exerciseId: squatId, sets: 1, reps: 1, startingWeight: '' }], tags: [], isSuperset: false })
    const usage = exerciseUsage(state, squatId)
    expect(usage.groupCount).toBe(4)
    expect(usage.groupNames).toEqual(['Warm-Up', 'Finisher', 'Third'])
  })
})

describe('isExerciseInUse', () => {
  it('is true when used, false when not', () => {
    const { state, squatId, carryId } = stateWithGroupsAndSessions()
    expect(isExerciseInUse(state, squatId)).toBe(true)
    expect(isExerciseInUse(state, carryId)).toBe(false)
  })
})

describe('tagCounts', () => {
  it('sorts tags by number of exercises using them, most-used first', () => {
    const exercises = [
      { tags: ['staple', 'posterior-chain'] },
      { tags: ['staple'] },
      { tags: ['staple'] },
      { tags: ['posterior-chain'] },
    ]
    expect(tagCounts(exercises)).toEqual([
      { tag: 'staple', count: 3 },
      { tag: 'posterior-chain', count: 2 },
    ])
  })

  it('breaks ties alphabetically', () => {
    const exercises = [{ tags: ['b'] }, { tags: ['a'] }]
    expect(tagCounts(exercises)).toEqual([
      { tag: 'a', count: 1 },
      { tag: 'b', count: 1 },
    ])
  })

  it('returns an empty list for no tags', () => {
    expect(tagCounts([{ tags: [] }])).toEqual([])
  })
})

describe('findCloseTag', () => {
  const tags = ['upper', 'posterior-chain', 'staple']

  it('matches case-insensitively by prefix', () => {
    expect(findCloseTag(tags, 'upp')).toBe('upper')
    expect(findCloseTag(tags, 'UPP')).toBe('upper')
  })

  it('falls back to a contains match', () => {
    expect(findCloseTag(tags, 'chain')).toBe('posterior-chain')
  })

  it('prefers a prefix match over a contains match', () => {
    const withBoth = ['chainsaw', 'posterior-chain']
    expect(findCloseTag(withBoth, 'chain')).toBe('chainsaw')
  })

  it('returns null when nothing matches or input is blank', () => {
    expect(findCloseTag(tags, 'xyz')).toBeNull()
    expect(findCloseTag(tags, '  ')).toBeNull()
  })
})

describe('allTagNames', () => {
  it('unions exercise tags and exercise group tags, deduped and sorted', () => {
    const state = { exercises: [{ tags: ['b-tag'] }, { tags: ['staple'] }], exerciseGroups: [{ tags: ['a-tag', 'b-tag'] }] }
    expect(allTagNames(state)).toEqual(['a-tag', 'b-tag', 'staple'])
  })
})

describe('exerciseGroupUsageCount', () => {
  it('counts plan sessions with a strength group whose label matches the saved group name', () => {
    const state = migrate(freshState())
    const group = { id: 'xg-1', name: 'Group A', items: [], tags: [], isSuperset: true } // matches seeded "Group A" label used in both "Lower A" and "Upper A"
    expect(exerciseGroupUsageCount(state, group)).toBe(2)
  })

  it('is zero when no session group shares the name', () => {
    const state = migrate(freshState())
    const group = { id: 'xg-1', name: 'Totally Unused Name', items: [], tags: [], isSuperset: true }
    expect(exerciseGroupUsageCount(state, group)).toBe(0)
  })
})
