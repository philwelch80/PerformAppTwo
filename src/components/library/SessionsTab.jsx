import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { useConfirm } from '../../state/ConfirmContext.jsx'
import { SESSION_TYPES, sessionTypeInfo } from '../../lib/taxonomy'
import { savedSessionUsageCount } from '../../lib/exercises'
import SavedSessionModal from './SavedSessionModal.jsx'
import AddToWeekDialog from './AddToWeekDialog.jsx'

// A short, type-specific summary line for a saved session's card — mirrors
// the mockup's per-type subtitle, using only fields the data model has
// (there's no stored session duration, so one isn't shown).
function sessionSummary(session) {
  if (session.type === 'strength') {
    const groupCount = session.data.groups.length
    const exerciseCount = session.data.groups.reduce((n, g) => n + g.items.length, 0)
    return `${groupCount} exercise group${groupCount === 1 ? '' : 's'} · ${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}`
  }
  if (session.type === 'conditioning') {
    const targetLabel = session.data.targetType === 'power' ? 'Power target' : 'HR target'
    return [session.data.modality, targetLabel].filter(Boolean).join(' · ')
  }
  const itemCount = session.data.items.length
  return `${itemCount} item${itemCount === 1 ? '' : 's'}`
}

export default function SessionsTab() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const confirm = useConfirm()
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
        <input type="text" aria-label="Search sessions" placeholder="Search sessions…" value={q} onChange={(e) => setQ(e.target.value)} />
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
            const usedIn = savedSessionUsageCount(state, s)
            return (
              <div className="panel reuse-card" key={s.id}>
                <div className="reuse-card-head">
                  <span className="ex-name">{s.name}</span>
                </div>
                <div className="ex-desc">{sessionSummary(s)}</div>
                <div className="ex-meta" style={{ marginTop: 6, alignItems: 'center' }}>
                  <span className={`type-badge ${typeInfo.badge}`}>{typeInfo.label}</span>
                  <span className="ex-desc">Used in {usedIn} week{usedIn === 1 ? '' : 's'}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setAddingToWeekId(s.id)}>
                    Add to week
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(s.id)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-danger-text"
                    onClick={async () => {
                      const ok = await confirm({ title: `Delete "${s.name}"?`, description: 'This cannot be undone.' })
                      if (!ok) return
                      dispatch({ type: 'SAVED_SESSION_DELETE', id: s.id })
                      toast('Saved session deleted')
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
