// Proposed default taxonomy — the original platform spec left this open.
// Flagged in-app as a starting point for coach feedback to correct.
export const MOVEMENT_PATTERNS = [
  'Squat',
  'Hinge',
  'Push (Horizontal)',
  'Push (Vertical)',
  'Pull (Horizontal)',
  'Pull (Vertical)',
  'Lunge / Single-Leg',
  'Carry',
  'Rotation / Anti-Rotation',
  'Core / Bracing',
]

export const BODY_AREAS = [
  'Quads',
  'Hamstrings',
  'Glutes',
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Calves',
  'Core',
  'Full Body',
]

export const EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Band',
  'Other',
]

export const CONDITIONING_MODALITIES = ['Running', 'Bike', 'Row', 'Other']

export const CONDITIONING_TARGET_TYPES = [
  { id: 'hr', label: 'Heart rate' },
  { id: 'power', label: 'Power' },
]

export const SESSION_TYPES = [
  { id: 'strength', label: 'Strength', dot: 'dot-strength', badge: 'type-strength' },
  { id: 'conditioning', label: 'Conditioning', dot: 'dot-conditioning', badge: 'type-conditioning' },
  { id: 'mobility', label: 'Stretch / Mobility', dot: 'dot-mobility', badge: 'type-mobility' },
]

export function sessionTypeInfo(type) {
  return SESSION_TYPES.find((t) => t.id === type) || SESSION_TYPES[0]
}

export function emptySessionData(type) {
  if (type === 'strength') return { groups: [] }
  if (type === 'conditioning') {
    return { modality: CONDITIONING_MODALITIES[0], description: '', pacing: '', targetType: 'hr', targetValue: '' }
  }
  return { items: [] }
}
