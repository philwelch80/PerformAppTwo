import { useRef } from 'react'
import { useStore } from '../../../state/StoreContext.jsx'

export default function MobilityEditor({ path, session }) {
  const { dispatch } = useStore()
  const dragIndex = useRef(null)
  const items = session.data.items

  return (
    <div>
      <div className="subtle-label">Routine (ordered — a flow, not sets/reps)</div>
      {items.length === 0 ? (
        <div className="empty-state">No items yet. Add the first step of the flow below.</div>
      ) : (
        items.map((item, index) => (
          <div
            key={index}
            className="routine-item"
            draggable
            onDragStart={() => { dragIndex.current = index }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (dragIndex.current === null || dragIndex.current === index) return
              dispatch({ type: 'MOBILITY_ITEMS_REORDER', path, fromIndex: dragIndex.current, toIndex: index })
              dragIndex.current = null
            }}
          >
            <span className="drag-handle" title="Drag to reorder">⋮⋮</span>
            <div className="field">
              <input
                type="text"
                placeholder="e.g. 90/90 hip switches"
                value={item.label}
                onChange={(e) => dispatch({ type: 'MOBILITY_ITEM_UPDATE', path, index, field: 'label', value: e.target.value })}
              />
            </div>
            <div className="field">
              <input
                type="text"
                placeholder="Note (optional) — e.g. 2 min per side"
                value={item.note}
                onChange={(e) => dispatch({ type: 'MOBILITY_ITEM_UPDATE', path, index, field: 'note', value: e.target.value })}
              />
            </div>
            <button className="btn btn-ghost btn-sm btn-danger-text" onClick={() => dispatch({ type: 'MOBILITY_ITEM_DELETE', path, index })}>
              ×
            </button>
          </div>
        ))
      )}
      <button className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => dispatch({ type: 'MOBILITY_ITEM_ADD', path })}>
        + Add item
      </button>
    </div>
  )
}
