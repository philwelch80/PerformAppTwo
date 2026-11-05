import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { allWeeksWithPath } from '../../lib/planTree'
import Modal from '../common/Modal.jsx'

export default function AddToWeekDialog({ sessionName, onConfirm, onCancel }) {
  const { state } = useStore()
  const weeks = allWeeksWithPath(state.plan)
  const [weekIndex, setWeekIndex] = useState(weeks.length > 0 ? 0 : -1)

  return (
    <Modal onClose={onCancel} labelledBy="add-to-week-title">
      <div className="modal-head">
        <h3 id="add-to-week-title">Add &ldquo;{sessionName}&rdquo; to a week</h3>
        <button className="btn btn-ghost" onClick={onCancel} aria-label="Close">
          ×
        </button>
      </div>

      {weeks.length === 0 ? (
        <div className="empty-state">No weeks yet — add one in Plan builder first.</div>
      ) : (
        <div className="field">
          <label htmlFor="add-to-week-select">Week</label>
          <select id="add-to-week-select" value={weekIndex} onChange={(e) => setWeekIndex(Number(e.target.value))}>
            {weeks.map((w, i) => (
              <option key={w.path.weekId} value={i}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="modal-actions">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={weekIndex < 0} onClick={() => onConfirm(weeks[weekIndex].path)}>
          Add
        </button>
      </div>
    </Modal>
  )
}
