import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { allWeeksWithPath } from '../../lib/planTree'

export default function AddToWeekDialog({ sessionName, onConfirm, onCancel }) {
  const { state } = useStore()
  const weeks = allWeeksWithPath(state.plan)
  const [weekIndex, setWeekIndex] = useState(weeks.length > 0 ? 0 : -1)

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-head">
          <h3>Add &ldquo;{sessionName}&rdquo; to a week</h3>
          <button className="btn btn-ghost" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        {weeks.length === 0 ? (
          <div className="empty-state">No weeks yet — add one in Plan builder first.</div>
        ) : (
          <div className="field">
            <label>Week</label>
            <select value={weekIndex} onChange={(e) => setWeekIndex(Number(e.target.value))}>
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
      </div>
    </div>
  )
}
