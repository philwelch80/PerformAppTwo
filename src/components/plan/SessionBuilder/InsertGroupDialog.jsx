import { useState } from 'react'
import { useStore } from '../../../state/StoreContext.jsx'
import Modal from '../../common/Modal.jsx'

function itemsSummary(exercises, items) {
  return items
    .map((item) => {
      const ex = exercises.find((e) => e.id === item.exerciseId)
      return `${ex ? ex.name : '(deleted exercise)'} ${item.sets}×${item.reps}`
    })
    .join(' · ')
}

// "Insert exercise group" — replaces the SessionBlockPicker popover.
// Position is an index into the session's data.groups array: 0 is "at the
// start", and after-group-N options cover everything through "at the end".
export default function InsertGroupDialog({ session, onInsert, onClose }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [position, setPosition] = useState(session.data.groups.length)

  const filtered = state.exerciseGroups.filter((g) => g.name.toLowerCase().includes(q.toLowerCase()))

  function submit() {
    if (!selectedId) return
    onInsert(selectedId, position)
  }

  return (
    <Modal onClose={onClose} labelledBy="insert-group-title" maxWidth={520}>
      <div className="modal-head">
        <h3 id="insert-group-title">Insert exercise group</h3>
        <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p style={{ color: 'var(--text-soft)', marginTop: 0 }}>
        Adds a copy of the exercise group to this session. Editing it afterwards doesn&apos;t change the saved group.
      </p>

      <div className="field">
        <label htmlFor="insert-group-search">Search exercise groups</label>
        <input
          id="insert-group-search"
          type="text"
          placeholder="Search exercise groups…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No saved exercise groups match.</div>
      ) : (
        <div role="radiogroup" aria-label="Exercise group" style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
          {filtered.map((g) => (
            <label
              key={g.id}
              className="panel panel-pad"
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                cursor: 'pointer',
                padding: 10,
                borderColor: selectedId === g.id ? 'var(--accent)' : undefined,
              }}
            >
              <input type="radio" name="insert-group" style={{ width: 'auto', marginTop: 3 }} checked={selectedId === g.id} onChange={() => setSelectedId(g.id)} />
              <div>
                <div style={{ fontWeight: 600 }}>
                  {g.name} {g.isSuperset && <span className="type-badge superset-badge">Superset</span>}
                </div>
                <div className="ex-desc">{itemsSummary(state.exercises, g.items)}</div>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="field">
        <label htmlFor="insert-group-position">Position</label>
        <select id="insert-group-position" value={position} onChange={(e) => setPosition(Number(e.target.value))}>
          <option value={0}>At the start</option>
          {session.data.groups.map((g, i) => (
            <option key={g.id} value={i + 1}>
              After group {i + 1} · {g.label || 'Straight sets'}
            </option>
          ))}
        </select>
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!selectedId} onClick={submit}>
          Insert group
        </button>
      </div>
    </Modal>
  )
}
