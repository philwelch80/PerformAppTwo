import { useMemo, useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { useConfirm } from '../../state/ConfirmContext.jsx'
import { tagCounts, exerciseGroupUsageCount } from '../../lib/exercises'
import TagFilterPills from './TagFilterPills.jsx'
import ExerciseGroupModal from './ExerciseGroupModal.jsx'

function exerciseName(exercises, id) {
  return exercises.find((e) => e.id === id)?.name || '(deleted exercise)'
}

function passesFilter(group, filter) {
  if (filter.q && !group.name.toLowerCase().includes(filter.q.toLowerCase())) return false
  if (filter.exerciseId && !group.items.some((i) => i.exerciseId === filter.exerciseId)) return false
  if (filter.supersetsOnly && !group.isSuperset) return false
  if (filter.tag && !group.tags.includes(filter.tag)) return false
  return true
}

export default function ExerciseGroupsTab() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const confirm = useConfirm()
  const [filter, setFilter] = useState({ q: '', exerciseId: '', supersetsOnly: false, tag: '' })
  const [editingId, setEditingId] = useState(null)

  const counts = useMemo(() => tagCounts(state.exerciseGroups), [state.exerciseGroups])
  const filtered = state.exerciseGroups.filter((g) => passesFilter(g, filter))

  return (
    <div className="library-layout">
      <aside className="library-sidebar">
        <input
          type="text"
          aria-label="Search exercise groups"
          placeholder="Search exercise groups…"
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />

        <div className="sidebar-group">
          <div className="subtle-label">Contains exercise</div>
          <select
            aria-label="Contains exercise"
            value={filter.exerciseId}
            onChange={(e) => setFilter({ ...filter, exerciseId: e.target.value })}
          >
            <option value="">Any exercise</option>
            {state.exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sidebar-group">
          <div className="subtle-label">Filters</div>
          <TagFilterPills counts={counts} active={filter.tag} onSelect={(tag) => setFilter({ ...filter, tag: tag || '' })} />
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 400, color: 'var(--ink)' }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={filter.supersetsOnly}
            onChange={(e) => setFilter({ ...filter, supersetsOnly: e.target.checked })}
          />
          Supersets only
        </label>
      </aside>

      <div className="library-main">
        {filtered.length === 0 ? (
          <div className="empty-state">
            {state.exerciseGroups.length === 0
              ? 'None yet. From a strength session, build a group of two or more exercises and use "Save as exercise group".'
              : 'No exercise groups match those filters.'}
          </div>
        ) : (
          <div className="reuse-grid">
            {filtered.map((g) => {
              const usedIn = exerciseGroupUsageCount(state, g)
              return (
                <div className="panel reuse-card" key={g.id}>
                  <div className="reuse-card-head">
                    <span className="ex-name">
                      {g.name} {g.isSuperset && <span className="type-badge superset-badge">Superset</span>}
                    </span>
                  </div>
                  <div className="ex-desc">
                    {g.items.map((item, i) => (
                      <div key={i}>
                        {exerciseName(state.exercises, item.exerciseId)} — {item.sets}×{item.reps}
                      </div>
                    ))}
                  </div>
                  {g.tags.length > 0 && (
                    <div className="ex-meta" style={{ marginTop: 6 }}>
                      {g.tags.map((t) => (
                        <span className="chip chip-tag" key={t}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="ex-desc" style={{ marginTop: 4 }}>used in {usedIn} session{usedIn === 1 ? '' : 's'}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(g.id)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        dispatch({ type: 'EXERCISE_GROUP_DUPLICATE', id: g.id })
                        toast('Exercise group duplicated')
                      }}
                    >
                      Duplicate
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-danger-text"
                      onClick={async () => {
                        const description =
                          usedIn > 0
                            ? `It's used in ${usedIn} session${usedIn === 1 ? '' : 's'} (those keep their own copy). This cannot be undone.`
                            : 'This cannot be undone.'
                        const ok = await confirm({ title: `Delete "${g.name}"?`, description })
                        if (!ok) return
                        dispatch({ type: 'EXERCISE_GROUP_DELETE', id: g.id })
                        toast('Exercise group deleted')
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editingId && <ExerciseGroupModal groupId={editingId} onClose={() => setEditingId(null)} />}
    </div>
  )
}
