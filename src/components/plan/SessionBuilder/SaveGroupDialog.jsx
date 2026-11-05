import { useState } from 'react'
import { useStore } from '../../../state/StoreContext.jsx'
import Modal from '../../common/Modal.jsx'

// "Save as exercise group" — only offered for groups with 2+ exercises
// (enforced by the caller). Matches the mockups' Dialogs board.
export default function SaveGroupDialog({ group, defaultName, onSave, onClose }) {
  const { state } = useStore()
  const [name, setName] = useState(defaultName || '')
  const [includeWeights, setIncludeWeights] = useState(true)
  const trimmed = name.trim()
  const isDuplicate = !!trimmed && state.exerciseGroups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())

  function submit() {
    if (!trimmed || isDuplicate) return
    onSave(trimmed, includeWeights)
  }

  return (
    <Modal onClose={onClose} labelledBy="save-group-title">
      <div className="modal-head">
        <h3 id="save-group-title">Save as exercise group</h3>
        <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p style={{ color: 'var(--text-soft)', marginTop: 0 }}>Saves this group so you can drop it into any session.</p>

      <div className="field">
        <label htmlFor="save-group-name">Group name</label>
        <input
          id="save-group-name"
          type="text"
          autoFocus
          value={name}
          aria-invalid={isDuplicate || undefined}
          className={isDuplicate ? 'input-error' : ''}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
        {isDuplicate && <div className="field-error" style={{ marginTop: 4 }}>A group named &ldquo;{trimmed}&rdquo; already exists.</div>}
      </div>

      <div className="sidebar-group" style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-m)', padding: 10, marginBottom: 12 }}>
        <div className="subtle-label">Includes</div>
        {group.items.map((item, i) => {
          const ex = state.exercises.find((e) => e.id === item.exerciseId)
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '3px 0' }}>
              <span style={{ fontWeight: 500 }}>{ex ? ex.name : '(deleted exercise)'}</span>
              <span className="ex-desc">
                {item.sets}×{item.reps}
                {includeWeights && item.startingWeight ? ` · ${item.startingWeight}` : ''}
              </span>
            </div>
          )
        })}
        {group.isSuperset && <div className="ex-desc" style={{ marginTop: 6 }}>Stays a superset — alternates one set at a time.</div>}
      </div>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 400, color: 'var(--text)' }}>
        <input type="checkbox" style={{ width: 'auto' }} checked={includeWeights} onChange={(e) => setIncludeWeights(e.target.checked)} />
        Include starting weights
      </label>

      <div className="modal-actions">
        <button className="btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!trimmed || isDuplicate} onClick={submit}>
          Save group
        </button>
      </div>
    </Modal>
  )
}
