import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { SESSION_TYPES, sessionTypeInfo } from '../../lib/taxonomy'
import SavedSessionModal from './SavedSessionModal.jsx'
import AddToWeekDialog from './AddToWeekDialog.jsx'

export default function SessionsTab() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [addingToWeekId, setAddingToWeekId] = useState(null)

  const filtered = state.savedSessions.filter(
    (s) => (!typeFilter || s.type === typeFilter) && (!q || s.name.toLowerCase().includes(q.toLowerCase())),
  )
  const addingToWeekSession = state.savedSessions.find((s) => s.id === addingToWeekId)

  return (
    <div>
      <div className="lib-toolbar" style={{ justifyContent: 'space-between' }}>
        <input type="text" placeholder="Search sessions…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="seg-control">
          <button type="button" className="seg-btn" aria-pressed={typeFilter === ''} onClick={() => setTypeFilter('')}>
            All
          </button>
          {SESSION_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="seg-btn"
              aria-pressed={typeFilter === t.id}
              onClick={() => setTypeFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          {state.savedSessions.length === 0
            ? 'None yet. From within a session, use "Save as session template".'
            : 'No saved sessions match that filter.'}
        </div>
      ) : (
        <div className="reuse-grid">
          {filtered.map((s) => {
            const typeInfo = sessionTypeInfo(s.type)
            return (
              <div className="panel reuse-card" key={s.id}>
                <div className="reuse-card-head">
                  <span className="ex-name">{s.name}</span>
                </div>
                <span className={`type-badge ${typeInfo.badge}`}>{typeInfo.label}</span>
                <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAddingToWeekId(s.id)}>
                    Add to week
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(s.id)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-danger-text"
                    onClick={() => {
                      if (window.confirm(`Delete "${s.name}"? This cannot be undone.`)) {
                        dispatch({ type: 'SAVED_SESSION_DELETE', id: s.id })
                        toast('Saved session deleted')
                      }
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

      {editingId && <SavedSessionModal sessionId={editingId} onClose={() => setEditingId(null)} />}

      {addingToWeekSession && (
        <AddToWeekDialog
          sessionName={addingToWeekSession.name}
          onCancel={() => setAddingToWeekId(null)}
          onConfirm={(path) => {
            dispatch({ ...path, type: 'SAVED_SESSION_INSERT', savedSessionId: addingToWeekSession.id })
            toast('Added to week')
            setAddingToWeekId(null)
          }}
        />
      )}
    </div>
  )
}
