import { useStore } from '../../../state/StoreContext.jsx'

export default function SessionBlockPicker({ onSelect, onClose }) {
  const { state } = useStore()

  return (
    <div className="picker-popover">
      {state.sessionBlocks.length === 0 ? (
        <div className="empty-state" style={{ padding: 10 }}>
          No saved session blocks yet. Save one from a strength group first.
        </div>
      ) : (
        state.sessionBlocks.map((b) => (
          <button
            key={b.id}
            className="picker-item"
            onClick={() => {
              onSelect(b.id)
              onClose()
            }}
          >
            <div className="pi-name">{b.name}</div>
            <div className="pi-meta">
              {b.items.length} exercise{b.items.length === 1 ? '' : 's'}
            </div>
          </button>
        ))
      )}
    </div>
  )
}
