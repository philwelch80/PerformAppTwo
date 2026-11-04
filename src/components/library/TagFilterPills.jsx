import { useState } from 'react'

const COLLAPSED_COUNT = 6

// Tag filter pills sorted by use, with counts; collapses to the top few
// once there are many, with a "Show all" expander. Single-select: click
// the active tag again to clear the filter.
export default function TagFilterPills({ counts, active, onSelect }) {
  const [showAll, setShowAll] = useState(false)
  if (counts.length === 0) return null

  const visible = showAll ? counts : counts.slice(0, COLLAPSED_COUNT)

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {visible.map(({ tag, count }) => (
        <button
          type="button"
          key={tag}
          className={`chip chip-btn${active === tag ? ' selected' : ''}`}
          aria-pressed={active === tag}
          onClick={() => onSelect(active === tag ? null : tag)}
        >
          #{tag} <span className="chip-count">{count}</span>
        </button>
      ))}
      {counts.length > COLLAPSED_COUNT && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show fewer' : `Show all (${counts.length})`}
        </button>
      )}
    </div>
  )
}
