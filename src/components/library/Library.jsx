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

const SUBTITLES = {
  exercises: (state) => {
    const active = state.exercises.filter((e) => !e.archived).length
    return `${active} active exercise${active === 1 ? '' : 's'} · movement pattern and body area are proposed defaults`
  },
  groups: () => 'Exercise groups are saved bundles of exercises you can drop into any session.',
  sessions: () => 'Saved sessions are whole sessions you can add to any week. Save one from the session builder.',
}

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
      <h1>Library</h1>
      <p className="lib-subtitle">{SUBTITLES[tab](state)}</p>

      <div className="tabs" role="tablist" aria-label="Library section" style={{ marginTop: 16, marginBottom: 16 }}>
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
