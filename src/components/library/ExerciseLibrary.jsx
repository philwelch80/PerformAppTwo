import { useMemo, useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { BODY_AREAS, EQUIPMENT } from '../../lib/taxonomy'
import ExerciseModal from './ExerciseModal.jsx'

function passesFilter(exercise, filter) {
  if (filter.q && !exercise.name.toLowerCase().includes(filter.q.toLowerCase())) return false
  if (filter.bodyArea && !exercise.bodyAreas.includes(filter.bodyArea)) return false
  if (filter.equipment && exercise.equipment !== filter.equipment) return false
  if (filter.tag && !exercise.tags.includes(filter.tag)) return false
  return true
}

export default function ExerciseLibrary() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState({ q: '', bodyArea: '', equipment: '', tag: '' })
  const [editingId, setEditingId] = useState(null) // 'new' | exercise id | null

  const allTags = useMemo(() => {
    const set = new Set()
    state.exercises.forEach((e) => e.tags.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [state.exercises])

  const filtered = state.exercises.filter((e) => passesFilter(e, filter))

  return (
    <div>
      <div className="lib-toolbar">
        <input
          type="text"
          placeholder="Search exercises…"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />
        <select value={filter.bodyArea} onChange={(e) => setFilter({ ...filter, bodyArea: e.target.value })}>
          <option value="">All body areas</option>
          {BODY_AREAS.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select value={filter.equipment} onChange={(e) => setFilter({ ...filter, equipment: e.target.value })}>
          <option value="">All equipment</option>
          {EQUIPMENT.map((eq) => (
            <option key={eq}>{eq}</option>
          ))}
        </select>
        {allTags.length > 0 && (
          <select value={filter.tag} onChange={(e) => setFilter({ ...filter, tag: e.target.value })}>
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}
        <span style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => setEditingId('new')}>
          + New exercise
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No exercises match those filters.</div>
      ) : (
        <div className="lib-grid">
          {filtered.map((e) => (
            <div className="panel ex-card" key={e.id}>
              <div className="ex-card-top">
                <span className="ex-name">{e.name}</span>
                <div className="ex-card-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(e.id)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-danger-text"
                    onClick={() => {
                      dispatch({ type: 'EXERCISE_DELETE', id: e.id })
                      toast('Exercise removed')
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="ex-meta">
                <span className="chip">{e.movementPattern}</span>
                {e.bodyAreas.map((b) => (
                  <span className="chip" key={b}>
                    {b}
                  </span>
                ))}
                <span className="chip">{e.equipment}</span>
              </div>
              {e.tags.length > 0 && (
                <div className="ex-meta">
                  {e.tags.map((t) => (
                    <span className="chip chip-tag" key={t}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              {e.description && <div className="ex-desc">{e.description}</div>}
            </div>
          ))}
        </div>
      )}

      {editingId && <ExerciseModal editingId={editingId} onClose={() => setEditingId(null)} />}
    </div>
  )
}
