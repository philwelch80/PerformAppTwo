import { describe, expect, it } from 'vitest'
import { CURRENT_VERSION, isNewerThanSupported, migrate } from './migrate'

function v1Fixture() {
  return {
    exercises: [
      { id: 'ex_squat', name: 'Back Squat', tags: ['staple'] },
      { id: 'ex_lunge', name: 'Walking Lunge', tags: [] },
    ],
    plan: {
      name: 'Example Plan',
      phases: [
        {
          id: 'phase_1',
          name: 'Off-Season',
          subphases: [
            {
              id: 'sub_1',
              name: 'General Prep',
              blocks: [
                {
                  id: 'block_1',
                  name: 'Block 1',
                  weeks: [
                    {
                      id: 'week_1',
                      name: 'Week 1',
                      focus: '',
                      sessions: [
                        {
                          id: 'sess_strength',
                          name: 'Lower A',
                          type: 'strength',
                          data: {
                            groups: [
                              { id: 'grp_single', label: '', items: [{ exerciseId: 'ex_squat', sets: 4, reps: 5, startingWeight: '' }] },
                              {
                                id: 'grp_multi',
                                label: 'Group A',
                                items: [
                                  { exerciseId: 'ex_lunge', sets: 3, reps: 10, startingWeight: '' },
                                  { exerciseId: 'ex_squat', sets: 3, reps: 12, startingWeight: '' },
                                ],
                              },
                            ],
                          },
                        },
                        {
                          id: 'sess_mobility',
                          name: 'Mobility Flow',
                          type: 'mobility',
                          data: { items: [{ label: '90/90 hip switches', note: '2 min per side' }] },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    savedSessions: [
      {
        id: 'tpl_1',
        name: 'Saved Mobility',
        type: 'mobility',
        data: { items: [{ label: 'Couch stretch', note: '' }] },
      },
    ],
    sessionBlocks: [
      {
        id: 'sb_1',
        name: 'Standard Warm-Up',
        items: [
          { exerciseId: 'ex_lunge', sets: 2, reps: 10, startingWeight: '' },
          { exerciseId: 'ex_squat', sets: 2, reps: 10, startingWeight: '' },
        ],
      },
    ],
  }
}

describe('migrate v1 -> v2', () => {
  it('renames mobility sessions to routines, in the plan and in saved sessions', () => {
    const result = migrate(v1Fixture())
    const [strengthSession, mobilitySession] = result.plan.phases[0].subphases[0].blocks[0].weeks[0].sessions
    expect(strengthSession.type).toBe('strength')
    expect(mobilitySession.type).toBe('routines')
    expect(mobilitySession.data.items).toEqual([{ label: '90/90 hip switches', note: '2 min per side' }])
    expect(result.savedSessions[0].type).toBe('routines')
  })

  it('marks groups with 2+ items as supersets, single-item groups not', () => {
    const result = migrate(v1Fixture())
    const [singleGroup, multiGroup] = result.plan.phases[0].subphases[0].blocks[0].weeks[0].sessions[0].data.groups
    expect(singleGroup.isSuperset).toBe(false)
    expect(multiGroup.isSuperset).toBe(true)
  })

  it('marks every exercise archived: false', () => {
    const result = migrate(v1Fixture())
    expect(result.exercises.every((e) => e.archived === false)).toBe(true)
  })

  it('renames sessionBlocks to exerciseGroups, adding tags and isSuperset', () => {
    const result = migrate(v1Fixture())
    expect(result.sessionBlocks).toBeUndefined()
    expect(result.exerciseGroups).toEqual([
      {
        id: 'sb_1',
        name: 'Standard Warm-Up',
        items: v1Fixture().sessionBlocks[0].items.map((item) => ({ ...item, reps: String(item.reps) })),
        tags: [],
        isSuperset: true,
      },
    ])
  })

  it('sets schemaVersion to CURRENT_VERSION', () => {
    const result = migrate(v1Fixture())
    expect(result.schemaVersion).toBe(CURRENT_VERSION)
    expect(CURRENT_VERSION).toBe(6)
  })

  it('stringifies reps (v1 -> v3 goes through v2 on the way)', () => {
    const result = migrate(v1Fixture())
    const [strengthSession] = result.plan.phases[0].subphases[0].blocks[0].weeks[0].sessions
    strengthSession.data.groups.forEach((g) => g.items.forEach((item) => expect(typeof item.reps).toBe('string')))
  })

  it('drops the stored week name (v1 -> v5 goes all the way through)', () => {
    const result = migrate(v1Fixture())
    expect(result.plan.phases[0].subphases[0].blocks[0].weeks[0].name).toBeUndefined()
  })

  it('does not mutate its input', () => {
    const fixture = v1Fixture()
    const snapshot = JSON.parse(JSON.stringify(fixture))
    migrate(fixture)
    expect(fixture).toEqual(snapshot)
  })

  it('is idempotent: migrating an already-current state changes nothing', () => {
    const once = migrate(v1Fixture())
    const twice = migrate(once)
    expect(twice).toEqual(once)
  })

  it('leaves a newer-than-supported state unchanged and flags it', () => {
    const fromTheFuture = { schemaVersion: 7, plan: { phases: [] }, exercises: [], savedSessions: [], exerciseGroups: [] }
    expect(isNewerThanSupported(fromTheFuture)).toBe(true)
    expect(migrate(fromTheFuture)).toEqual(fromTheFuture)
  })

  it('treats a state with no schemaVersion as v1', () => {
    expect(isNewerThanSupported(v1Fixture())).toBe(false)
  })
})

describe('migrate v2 -> v3', () => {
  function v2Fixture() {
    return {
      schemaVersion: 2,
      exercises: [{ id: 'ex_squat', name: 'Back Squat', tags: ['staple'], archived: false }],
      plan: {
        name: 'Example Plan',
        phases: [
          {
            id: 'phase_1',
            name: 'Off-Season',
            subphases: [
              {
                id: 'sub_1',
                name: 'General Prep',
                blocks: [
                  {
                    id: 'block_1',
                    name: 'Block 1',
                    weeks: [
                      {
                        id: 'week_1',
                        name: 'Week 1',
                        focus: '',
                        sessions: [
                          {
                            id: 'sess_strength',
                            name: 'Lower A',
                            type: 'strength',
                            data: { groups: [{ id: 'grp_1', label: '', items: [{ exerciseId: 'ex_squat', sets: 4, reps: 5, startingWeight: '' }], isSuperset: false }] },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      savedSessions: [
        { id: 'tpl_1', name: 'Saved Lower', type: 'strength', data: { groups: [{ id: 'grp_2', label: '', items: [{ exerciseId: 'ex_squat', sets: 3, reps: 8, startingWeight: '' }], isSuperset: false }] } },
      ],
      exerciseGroups: [{ id: 'xg_1', name: 'Warm-Up', items: [{ exerciseId: 'ex_squat', sets: 2, reps: 10, startingWeight: '' }], tags: [], isSuperset: false }],
    }
  }

  it('stringifies reps on plan sessions, saved sessions and exercise groups', () => {
    const result = migrate(v2Fixture())
    expect(result.plan.phases[0].subphases[0].blocks[0].weeks[0].sessions[0].data.groups[0].items[0].reps).toBe('5')
    expect(result.savedSessions[0].data.groups[0].items[0].reps).toBe('8')
    expect(result.exerciseGroups[0].items[0].reps).toBe('10')
    expect(result.schemaVersion).toBe(CURRENT_VERSION) // migrate always runs through to the latest version
  })

  it('leaves an already-string reps value alone', () => {
    const fixture = v2Fixture()
    fixture.exerciseGroups[0].items[0].reps = '8-10'
    const result = migrate(fixture)
    expect(result.exerciseGroups[0].items[0].reps).toBe('8-10')
  })

  it('is idempotent', () => {
    const once = migrate(v2Fixture())
    const twice = migrate(once)
    expect(twice).toEqual(once)
  })

  it('does not mutate its input', () => {
    const fixture = v2Fixture()
    const snapshot = JSON.parse(JSON.stringify(fixture))
    migrate(fixture)
    expect(fixture).toEqual(snapshot)
  })
})

describe('migrate v3 -> v4', () => {
  function v3Fixture() {
    return {
      schemaVersion: 3,
      exercises: [{ id: 'ex_1', name: 'Back Squat', tags: ['staple', 'Compound', 'compound'], archived: false }],
      plan: { name: 'Plan', phases: [] },
      savedSessions: [],
      exerciseGroups: [{ id: 'xg_1', name: 'Warm-Up', items: [], tags: ['Warm Up', 'warm-up'], isSuperset: false }],
    }
  }

  it('lowercases and hyphenates tags, merging duplicates that only differed by case', () => {
    const result = migrate(v3Fixture())
    expect(result.exercises[0].tags).toEqual(['staple', 'compound'])
    expect(result.exerciseGroups[0].tags).toEqual(['warm-up'])
    expect(result.schemaVersion).toBe(CURRENT_VERSION) // migrate always runs through to the latest version
  })

  it('is idempotent', () => {
    const once = migrate(v3Fixture())
    const twice = migrate(once)
    expect(twice).toEqual(once)
  })

  it('does not mutate its input', () => {
    const fixture = v3Fixture()
    const snapshot = JSON.parse(JSON.stringify(fixture))
    migrate(fixture)
    expect(fixture).toEqual(snapshot)
  })
})

describe('migrate v4 -> v5', () => {
  function v4Fixture() {
    return {
      schemaVersion: 4,
      exercises: [],
      savedSessions: [],
      exerciseGroups: [],
      plan: {
        name: 'Plan',
        phases: [
          {
            id: 'phase_1',
            name: 'Off-Season',
            subphases: [
              {
                id: 'sub_1',
                name: 'General Prep',
                blocks: [
                  {
                    id: 'block_1',
                    name: 'Block 1',
                    weeks: [
                      { id: 'week_1', name: 'Week 1', focus: '', sessions: [] },
                      { id: 'week_2', name: 'Week 1 copy', focus: '', sessions: [] },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    }
  }

  it('drops the stored week name', () => {
    const result = migrate(v4Fixture())
    result.plan.phases[0].subphases[0].blocks[0].weeks.forEach((week) => expect(week.name).toBeUndefined())
    expect(result.schemaVersion).toBe(CURRENT_VERSION) // migrate always runs through to the latest version
  })

  it('is idempotent', () => {
    const once = migrate(v4Fixture())
    const twice = migrate(once)
    expect(twice).toEqual(once)
  })

  it('does not mutate its input', () => {
    const fixture = v4Fixture()
    const snapshot = JSON.parse(JSON.stringify(fixture))
    migrate(fixture)
    expect(fixture).toEqual(snapshot)
  })
})

describe('migrate v5 -> v6', () => {
  function v5Fixture() {
    return {
      schemaVersion: 5,
      exercises: [],
      savedSessions: [],
      exerciseGroups: [],
      plan: {
        name: 'Plan',
        phases: [
          {
            id: 'phase_1',
            name: 'Off-Season',
            subphases: [
              {
                id: 'sub_1',
                name: 'General Prep',
                blocks: [
                  {
                    id: 'block_1',
                    name: 'Block 1',
                    weeks: [
                      {
                        id: 'week_1',
                        focus: '',
                        sessions: [
                          { id: 'sess_1', name: 'Lower A', type: 'strength', data: { groups: [] } },
                          { id: 'sess_2', name: 'Tempo Run', type: 'conditioning', data: {} },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    }
  }

  it('gives the plan a Monday start date and the default day slots', () => {
    const result = migrate(v5Fixture())
    expect(result.plan.startDate).toBe('2026-11-09')
    expect(result.plan.daySlots).toEqual(['AM', 'PM'])
  })

  it('puts every existing session into the unscheduled state', () => {
    const result = migrate(v5Fixture())
    result.plan.phases[0].subphases[0].blocks[0].weeks[0].sessions.forEach((session) => {
      expect(session.day).toBeNull()
      expect(session.slot).toBeNull()
      expect(session.startTime).toBeNull()
      expect(session.plannedRpe).toBeNull()
      expect(session.plannedMinutes).toBeNull()
    })
  })

  it('sets schemaVersion to 6', () => {
    const result = migrate(v5Fixture())
    expect(result.schemaVersion).toBe(6)
    expect(CURRENT_VERSION).toBe(6)
  })

  it('is idempotent', () => {
    const once = migrate(v5Fixture())
    const twice = migrate(once)
    expect(twice).toEqual(once)
  })

  it('does not mutate its input', () => {
    const fixture = v5Fixture()
    const snapshot = JSON.parse(JSON.stringify(fixture))
    migrate(fixture)
    expect(fixture).toEqual(snapshot)
  })

  it('leaves a newer-than-supported state (v7) unchanged and flags it', () => {
    const fromTheFuture = { schemaVersion: 7, plan: { phases: [] }, exercises: [], savedSessions: [], exerciseGroups: [] }
    expect(isNewerThanSupported(fromTheFuture)).toBe(true)
    expect(migrate(fromTheFuture)).toEqual(fromTheFuture)
  })
})
