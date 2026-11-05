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

describe('EXERCISE_GROUP_UPDATE / DUPLICATE / ITEM_*', () => {
  it('updates name, tags and isSuperset on a saved exercise group', () => {
    const state = initialState()
    const group = state.exerciseGroups[0]
    const next = reducer(state, { type: 'EXERCISE_GROUP_UPDATE', id: group.id, payload: { name: 'Renamed', tags: ['upper'], isSuperset: false } })
    const updated = next.exerciseGroups.find((g) => g.id === group.id)
    expect(updated.name).toBe('Renamed')
    expect(updated.tags).toEqual(['upper'])
    expect(updated.isSuperset).toBe(false)
  })

  it('duplicates a group with a fresh id and a "copy" suffix', () => {
    const state = initialState()
    const group = state.exerciseGroups[0]
    const next = reducer(state, { type: 'EXERCISE_GROUP_DUPLICATE', id: group.id })
    expect(next.exerciseGroups.length).toBe(state.exerciseGroups.length + 1)
    const copy = next.exerciseGroups.find((g) => g.name === `${group.name} copy`)
    expect(copy).toBeDefined()
    expect(copy.id).not.toBe(group.id)
  })

  it('adds, updates and deletes items on a saved exercise group', () => {
    const state = initialState()
    const group = state.exerciseGroups[0]
    const exerciseId = state.exercises[0].id

    const added = reducer(state, { type: 'EXERCISE_GROUP_ITEM_ADD', id: group.id, exerciseId })
    const afterAdd = added.exerciseGroups.find((g) => g.id === group.id)
    expect(afterAdd.items.length).toBe(group.items.length + 1)

    const updated = reducer(added, { type: 'EXERCISE_GROUP_ITEM_UPDATE', id: group.id, itemIndex: 0, field: 'sets', value: 7 })
    expect(updated.exerciseGroups.find((g) => g.id === group.id).items[0].sets).toBe(7)

    const deleted = reducer(updated, { type: 'EXERCISE_GROUP_ITEM_DELETE', id: group.id, itemIndex: 0 })
    expect(deleted.exerciseGroups.find((g) => g.id === group.id).items.length).toBe(afterAdd.items.length - 1)
  })
})

describe('HYDRATE', () => {
  it('keeps a selection and its expand state when the selected node still exists', () => {
    const state = initialState()
    const path = pathToSession(state, 'Lower A')
    const selected = { ...state, selectedPath: path, expanded: { ...state.expanded, [path.weekId]: false } }

    const next = reducer(selected, { type: 'HYDRATE', payload: { ...state } })
    expect(next.selectedPath).toEqual(path)
    expect(next.expanded[path.weekId]).toBe(false) // this viewer's own collapse choice survives
  })

  it('clears the selection only when the selected node is gone from the hydrated plan', () => {
    const state = initialState()
    const path = pathToSession(state, 'Lower A')
    const selected = { ...state, selectedPath: path }

    const week = state.plan.phases[0].subphases[0].blocks[0].weeks.find((w) => w.id === path.weekId)
    const payload = { ...state, plan: { ...state.plan, phases: [{ ...state.plan.phases[0], subphases: [{ ...state.plan.phases[0].subphases[0], blocks: [{ ...state.plan.phases[0].subphases[0].blocks[0], weeks: state.plan.phases[0].subphases[0].blocks[0].weeks.filter((w) => w.id !== week.id) }] }] }] } }

    const next = reducer(selected, { type: 'HYDRATE', payload })
    expect(next.selectedPath).toBeNull()
  })

  it('adds expand state for nodes new to this viewer without resetting existing ones', () => {
    const state = initialState()
    const collapsed = { ...state, expanded: { someId: false } }
    const next = reducer(collapsed, { type: 'HYDRATE', payload: { ...state } })
    expect(next.expanded.someId).toBe(false)
    expect(next.expanded[state.plan.phases[0].id]).toBe(true)
  })

  it('replaces only the shared slice, never touching selectedPath/expanded directly', () => {
    const state = initialState()
    const withExtraExercise = { ...state, exercises: [...state.exercises, { id: 'ex_new', name: 'New', tags: [], archived: false }] }
    const next = reducer(state, { type: 'HYDRATE', payload: withExtraExercise })
    expect(next.exercises.find((e) => e.id === 'ex_new')).toBeDefined()
  })
})

describe('editing a saved session template directly (path.savedSessionId)', () => {
  it('renames and edits a saved session template in place, without touching the plan', () => {
    const state = initialState()
    const saved = { id: 'tpl-1', name: 'Saved Lower', type: 'strength', data: { groups: [{ id: 'grp-1', label: '', items: [], isSuperset: false }] } }
    const withSaved = { ...state, savedSessions: [...state.savedSessions, saved] }
    const path = { savedSessionId: 'tpl-1' }

    const renamed = reducer(withSaved, { type: 'SESSION_RENAME', path, name: 'Renamed Template' })
    expect(renamed.savedSessions.find((s) => s.id === 'tpl-1').name).toBe('Renamed Template')

    const grouped = reducer(renamed, { type: 'GROUP_ADD', path })
    expect(grouped.savedSessions.find((s) => s.id === 'tpl-1').data.groups.length).toBe(2)
  })
})
