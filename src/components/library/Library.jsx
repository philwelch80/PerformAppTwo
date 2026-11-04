import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import ExercisesTab from './ExercisesTab.jsx'
import ExerciseGroupsTab from './ExerciseGroupsTab.jsx'
import SessionsTab from './SessionsTab.jsx'

const SUBTABS = [
  { id: 'exercises', label: 'Exercises' },
  { id: 'groups', label: 'Exercise groups' },
  { id: 'sessions', label: 'Sessions' },
]

export default function Library() {
  const { state } = useStore()
  const [tab, setTab] = useState('exercises')

  const counts = {
    exercises: state.exercises.filter((e) => !e.archived).length,
    groups: state.exerciseGroups.length,
    sessions: state.savedSessions.length,
  }

  return (
    <div>
      <div className="tabs" role="tablist" aria-label="Library section" style={{ marginBottom: 16 }}>
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            className="tab-btn"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="count">{counts[t.id]}</span>
          </button>
        ))}
      </div>

      {tab === 'exercises' && <ExercisesTab />}
      {tab === 'groups' && <ExerciseGroupsTab />}
      {tab === 'sessions' && <SessionsTab />}
    </div>
  )
}
