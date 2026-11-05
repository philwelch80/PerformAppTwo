import { useState } from 'react'
import Modal from './Modal.jsx'

// The shared single-text-field prompt (rename, name a new thing). Rendered
// by PromptProvider; see usePrompt().
export default function PromptDialog({ title, label, defaultValue = '', confirmLabel = 'Save', onConfirm, onCancel }) {
  const [value, setValue] = useState(defaultValue)
  const trimmed = value.trim()

  function submit() {
    if (!trimmed) return
    onConfirm(trimmed)
  }

  return (
    <Modal onClose={onCancel} labelledBy="prompt-dialog-title">
      <div className="modal-head">
        <h3 id="prompt-dialog-title">{title}</h3>
      </div>
      <div className="field">
        <label htmlFor="prompt-dialog-input">{label || title}</label>
        <input
          id="prompt-dialog-input"
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
          }}
        />
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={!trimmed} onClick={submit}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
