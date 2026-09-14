import { uid } from './id'

export function seedExercises() {
  return [
    { id: uid('ex'), name: 'Back Squat', description: 'Bar on upper traps, brace before unrack. Cue: knees track over toes, chest tall out of the hole.', videoUrl: '', movementPattern: 'Squat', bodyAreas: ['Quads', 'Glutes'], equipment: 'Barbell', tags: ['staple'] },
    { id: uid('ex'), name: 'Romanian Deadlift', description: 'Soft knees, hinge from the hips, bar stays close to the shins on the way down.', videoUrl: '', movementPattern: 'Hinge', bodyAreas: ['Hamstrings', 'Glutes'], equipment: 'Barbell', tags: ['staple', 'posterior-chain'] },
    { id: uid('ex'), name: 'Bench Press', description: 'Shoulder blades pinned, feet driving into the floor, bar path touches low chest.', videoUrl: '', movementPattern: 'Push (Horizontal)', bodyAreas: ['Chest', 'Triceps'], equipment: 'Barbell', tags: ['staple'] },
    { id: uid('ex'), name: 'Standing DB Shoulder Press', description: 'Ribs down, glutes braced — press without leaning back through the lumbar spine.', videoUrl: '', movementPattern: 'Push (Vertical)', bodyAreas: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', tags: [] },
    { id: uid('ex'), name: 'Chin-Up', description: 'Full hang to chin over bar. Add a plate once bodyweight x10 is easy.', videoUrl: '', movementPattern: 'Pull (Vertical)', bodyAreas: ['Back', 'Biceps'], equipment: 'Bodyweight', tags: ['staple'] },
    { id: uid('ex'), name: 'Single-Arm DB Row', description: 'Flat back, row to hip not shoulder, control the negative.', videoUrl: '', movementPattern: 'Pull (Horizontal)', bodyAreas: ['Back', 'Biceps'], equipment: 'Dumbbell', tags: [] },
    { id: uid('ex'), name: 'Walking Lunge', description: 'Long enough stride for a 90/90 front knee, torso stays tall.', videoUrl: '', movementPattern: 'Lunge / Single-Leg', bodyAreas: ['Quads', 'Glutes'], equipment: 'Dumbbell', tags: [] },
    { id: uid('ex'), name: "Farmer's Carry", description: 'Heavy in each hand, tall posture, short fast steps.', videoUrl: '', movementPattern: 'Carry', bodyAreas: ['Full Body', 'Core'], equipment: 'Kettlebell', tags: ['conditioning-adjacent'] },
    { id: uid('ex'), name: 'Pallof Press', description: 'Anti-rotation — resist the cable pulling you toward the anchor.', videoUrl: '', movementPattern: 'Rotation / Anti-Rotation', bodyAreas: ['Core'], equipment: 'Cable', tags: [] },
    { id: uid('ex'), name: 'Hanging Leg Raise', description: 'Posterior pelvic tilt at the top, control the lower.', videoUrl: '', movementPattern: 'Core / Bracing', bodyAreas: ['Core'], equipment: 'Bodyweight', tags: [] },
  ]
}

export function seedPlan(exercises) {
  const exId = (name) => exercises.find((e) => e.name === name).id

  const week1 = {
    id: uid('week'),
    name: 'Week 1',
    focus: 'Establish baseline loads',
    sessions: [
      {
        id: uid('sess'),
        name: 'Lower A',
        type: 'strength',
        data: {
          groups: [
            { id: uid('grp'), label: '', items: [{ exerciseId: exId('Back Squat'), sets: 4, reps: 5, startingWeight: '' }] },
            {
              id: uid('grp'),
              label: 'Group A',
              items: [
                { exerciseId: exId('Walking Lunge'), sets: 3, reps: 10, startingWeight: '' },
                { exerciseId: exId('Pallof Press'), sets: 3, reps: 12, startingWeight: '' },
              ],
            },
          ],
        },
      },
      {
        id: uid('sess'),
        name: 'Tempo Run',
        type: 'conditioning',
        data: { modality: 'Running', description: 'Continuous steady effort, flat route.', pacing: '30 min continuous', targetType: 'hr', targetValue: '145-155 bpm' },
      },
      {
        id: uid('sess'),
        name: 'Mobility Flow',
        type: 'mobility',
        data: {
          items: [
            { label: '90/90 hip switches', note: '2 min per side' },
            { label: 'Couch stretch', note: '60s per side' },
            { label: 'Thoracic rotations', note: '10 per side, slow' },
          ],
        },
      },
    ],
  }

  const week2 = {
    id: uid('week'),
    name: 'Week 2',
    focus: 'Add volume, same intensity',
    sessions: [
      {
        id: uid('sess'),
        name: 'Upper A',
        type: 'strength',
        data: {
          groups: [
            { id: uid('grp'), label: '', items: [{ exerciseId: exId('Bench Press'), sets: 4, reps: 6, startingWeight: '' }] },
            {
              id: uid('grp'),
              label: 'Group A',
              items: [
                { exerciseId: exId('Chin-Up'), sets: 3, reps: 8, startingWeight: '' },
                { exerciseId: exId('Single-Arm DB Row'), sets: 3, reps: 10, startingWeight: '' },
              ],
            },
          ],
        },
      },
    ],
  }

  return {
    name: 'Off-Season Strength — Example Plan',
    phases: [
      {
        id: uid('phase'),
        name: 'Off-Season',
        subphases: [
          {
            id: uid('sub'),
            name: 'General Prep',
            blocks: [{ id: uid('block'), name: 'Block 1 (Weeks 1-4)', weeks: [week1, week2] }],
          },
        ],
      },
    ],
  }
}

export function seedSessionBlocks(exercises) {
  const exId = (name) => exercises.find((e) => e.name === name).id
  return [
    {
      id: uid('sb'),
      name: 'Standard Warm-Up',
      items: [
        { exerciseId: exId('Walking Lunge'), sets: 2, reps: 10, startingWeight: '' },
        { exerciseId: exId('Pallof Press'), sets: 2, reps: 10, startingWeight: '' },
      ],
    },
  ]
}

export function expandedFromPlan(plan) {
  const expanded = {}
  plan.phases.forEach((p) => {
    expanded[p.id] = true
    p.subphases.forEach((s) => {
      expanded[s.id] = true
      s.blocks.forEach((b) => {
        expanded[b.id] = true
        b.weeks.forEach((w) => {
          expanded[w.id] = true
        })
      })
    })
  })
  return expanded
}

export function freshState() {
  const exercises = seedExercises()
  const plan = seedPlan(exercises)
  return {
    exercises,
    plan,
    savedSessions: [],
    sessionBlocks: seedSessionBlocks(exercises),
    selectedPath: null,
    expanded: expandedFromPlan(plan),
  }
}
