import { describe, it, expect } from 'vitest'
import { reducer } from './reducer'
import { migrate } from '../lib/migrate'
import { freshState } from '../lib/seed'

function initialState() {
  return migrate(freshState())
}

function pathToSession(state, sessionName) {
  for (const phase of state.plan.phases) {
    for (const sub of phase.subphases) {
      for (const block of sub.blocks) {
        for (const week of block.weeks) {
          const session = week.sessions.find((s) => s.name === sessionName)
          if (session) return { phaseId: phase.id, subId: sub.id, blockId: block.id, weekId: week.id, sessionId: session.id }
        }
      }
    }
  }
  throw new Error(`session not found: ${sessionName}`)
}

function sessionByName(state, sessionName) {
  const path = pathToSession(state, sessionName)
  return state.plan.phases
    .find((p) => p.id === path.phaseId)
    .subphases.find((s) => s.id === path.subId)
    .blocks.find((b) => b.id === path.blockId)
    .weeks.find((w) => w.id === path.weekId)
    .sessions.find((s) => s.id === path.sessionId)
}

describe('EXERCISE_DELETE', () => {
  it('deletes an exercise that is not referenced anywhere', () => {
    const state = initialState()
    const carryId = state.exercises.find((e) => e.name === "Farmer's Carry").id
    const next = reducer(state, { type: 'EXERCISE_DELETE', id: carryId })
    expect(next.exercises.find((e) => e.id === carryId)).toBeUndefined()
  })

  it('refuses to delete an exercise used in a plan session', () => {
    const state = initialState()
    const squatId = state.exercises.find((e) => e.name === 'Back Squat').id
    const next = reducer(state, { type: 'EXERCISE_DELETE', id: squatId })
    expect(next.exercises.find((e) => e.id === squatId)).toBeDefined()
  })

  it('refuses to delete an exercise used in a saved exercise group', () => {
    const state = initialState()
    const lungeId = state.exercises.find((e) => e.name === 'Walking Lunge').id // in the migrated "Standard Warm-Up" group
    const next = reducer(state, { type: 'EXERCISE_DELETE', id: lungeId })
    expect(next.exercises.find((e) => e.id === lungeId)).toBeDefined()
  })
})

describe('EXERCISE_ARCHIVE / EXERCISE_RESTORE', () => {
  it('archives and restores an exercise regardless of usage', () => {
    const state = initialState()
    const squatId = state.exercises.find((e) => e.name === 'Back Squat').id
    const archived = reducer(state, { type: 'EXERCISE_ARCHIVE', id: squatId })
    expect(archived.exercises.find((e) => e.id === squatId).archived).toBe(true)
    const restored = reducer(archived, { type: 'EXERCISE_RESTORE', id: squatId })
    expect(restored.exercises.find((e) => e.id === squatId).archived).toBe(false)
  })
})

describe('GROUP_SAVE_AS_GROUP', () => {
  it('refuses to save a single-exercise group', () => {
    const state = initialState()
    const path = pathToSession(state, 'Lower A')
    const session = sessionByName(state, 'Lower A')
    const singleItemGroup = session.data.groups.find((g) => g.items.length === 1)
    const countBefore = state.exerciseGroups.length
    const next = reducer(state, { type: 'GROUP_SAVE_AS_GROUP', path, groupId: singleItemGroup.id, name: 'Should not save' })
    expect(next.exerciseGroups.length).toBe(countBefore)
  })

  it('saves a group with two or more items as a superset exercise group', () => {
    const state = initialState()
    const path = pathToSession(state, 'Lower A')
    const session = sessionByName(state, 'Lower A')
    const multiItemGroup = session.data.groups.find((g) => g.items.length >= 2)
    const next = reducer(state, { type: 'GROUP_SAVE_AS_GROUP', path, groupId: multiItemGroup.id, name: 'New Group' })
    const saved = next.exerciseGroups.find((g) => g.name === 'New Group')
    expect(saved).toBeDefined()
    expect(saved.isSuperset).toBe(true)
    expect(saved.items.length).toBe(multiItemGroup.items.length)
  })
})

describe('EXERCISE_GROUP_INSERT / EXERCISE_GROUP_DELETE', () => {
  it('inserts a saved exercise group into a session as a new group', () => {
    const state = initialState()
    const path = pathToSession(state, 'Lower A')
    const exerciseGroup = state.exerciseGroups[0]
    const countBefore = sessionByName(state, 'Lower A').data.groups.length
    const next = reducer(state, { type: 'EXERCISE_GROUP_INSERT', path, exerciseGroupId: exerciseGroup.id })
    const groups = sessionByName(next, 'Lower A').data.groups
    expect(groups.length).toBe(countBefore + 1)
    expect(groups[groups.length - 1].label).toBe(exerciseGroup.name)
  })

  it('removes a saved exercise group', () => {
    const state = initialState()
    const exerciseGroup = state.exerciseGroups[0]
    const next = reducer(state, { type: 'EXERCISE_GROUP_DELETE', id: exerciseGroup.id })
    expect(next.exerciseGroups.find((g) => g.id === exerciseGroup.id)).toBeUndefined()
  })
})

describe('ROUTINE_ITEM_* actions', () => {
  it('adds, updates and deletes items on a routines session', () => {
    const state = initialState()
    const path = pathToSession(state, 'Mobility Flow')
    const countBefore = sessionByName(state, 'Mobility Flow').data.items.length

    const added = reducer(state, { type: 'ROUTINE_ITEM_ADD', path })
    expect(sessionByName(added, 'Mobility Flow').data.items.length).toBe(countBefore + 1)

    const updated = reducer(added, { type: 'ROUTINE_ITEM_UPDATE', path, index: countBefore, field: 'label', value: 'New step' })
    expect(sessionByName(updated, 'Mobility Flow').data.items[countBefore].label).toBe('New step')

    const deleted = reducer(updated, { type: 'ROUTINE_ITEM_DELETE', path, index: countBefore })
    expect(sessionByName(deleted, 'Mobility Flow').data.items.length).toBe(countBefore)
  })
})
