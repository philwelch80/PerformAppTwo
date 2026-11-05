import { useMemo, useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { BODY_AREAS, EQUIPMENT } from '../../lib/taxonomy'
import { tagCounts } from '../../lib/exercises'
import TagFilterPills from './TagFilterPills.jsx'
import ExerciseModal from './ExerciseModal.jsx'

function passesFilter(exercise, filter) {
  if (!filter.showArchived && exercise.archived) return false
  if (filter.q && !exercise.name.toLowerCase().includes(filter.q.toLowerCase())) return false
  if (filter.bodyArea && !exercise.bodyAreas.includes(filter.bodyArea)) return false
  if (filter.equipment && exercise.equipment !== filter.equipment) return false
  if (filter.tag && !exercise.tags.includes(filter.tag)) return false
  return true
}

export default function ExercisesTab() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState({ q: '', bodyArea: '', equipment: '', tag: '', showArchived: false })
  const [editingId, setEditingId] = useState(null) // 'new' | exercise id | null

  const counts = useMemo(() => tagCounts(state.exercises), [state.exercises])
  const filtered = state.exercises.filter((e) => passesFilter(e, filter))

  return (
    <div className={`library-layout${editingId ? ' has-panel' : ''}`}>
      <aside className="library-sidebar">
        <input
          type="text"
          aria-label="Search exercises"
          placeholder="Search exercises…"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />

        <div className="sidebar-group">
          <div className="subtle-label">Body area</div>
          <div className="sidebar-check-list">
            {BODY_AREAS.map((b) => (
              <label key={b}>
                <input
                  type="checkbox"
                  checked={filter.bodyArea === b}
                  onChange={() => setFilter({ ...filter, bodyArea: filter.bodyArea === b ? '' : b })}
                />
                {b}
              </label>
            ))}
          </div>
        </div>

        <div className="sidebar-group">
          <div className="subtle-label">Equipment</div>
          <div className="sidebar-check-list">
            {EQUIPMENT.map((eq) => (
              <label key={eq}>
                <input
                  type="checkbox"
                  checked={filter.equipment === eq}
                  onChange={() => setFilter({ ...filter, equipment: filter.equipment === eq ? '' : eq })}
                />
                {eq}
              </label>
            ))}
          </div>
        </div>

        <div className="sidebar-group">
          <div className="subtle-label">Tags</div>
          <TagFilterPills counts={counts} active={filter.tag} onSelect={(tag) => setFilter({ ...filter, tag: tag || '' })} />
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 400, color: 'var(--ink)' }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={filter.showArchived}
            onChange={(e) => setFilter({ ...filter, showArchived: e.target.checked })}
          />
          Show archived
        </label>
      </aside>

      <div className="library-main">
        <div className="lib-toolbar" style={{ justifyContent: 'flex-end' }}>
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
                    {e.archived && <span className="chip chip-archived">Archived</span>}
                    {e.archived && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          dispatch({ type: 'EXERCISE_RESTORE', id: e.id })
                          toast('Exercise restored')
                        }}
                      >
                        Restore
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(e.id)}>
                      Edit
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
      </div>

      {editingId && <ExerciseModal editingId={editingId} onClose={() => setEditingId(null)} />}
    </div>
  )
}
