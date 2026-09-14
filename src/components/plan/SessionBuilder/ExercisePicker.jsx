import { useState } from 'react'
import { useStore } from '../../../state/StoreContext.jsx'

export default function ExercisePicker({ onSelect, onClose }) {
  const { state } = useStore()
  const [q, setQ] = useState('')

  const filtered = state.exercises.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="picker-popover">
      <input
        type="text"
        placeholder="Search exercises…"
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 6 }}
      />
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: 10 }}>
          No matches. Add it in the Exercise Library first.
        </div>
      ) : (
        filtered.map((e) => (
          <button
            key={e.id}
            className="picker-item"
            onClick={() => {
              onSelect(e.id)
              onClose()
            }}
          >
            <div className="pi-name">{e.name}</div>
            <div className="pi-meta">
              {e.movementPattern} · {e.equipment}
            </div>
          </button>
        ))
      )}
    </div>
  )
}
