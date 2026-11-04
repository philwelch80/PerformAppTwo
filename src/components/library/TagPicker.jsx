import { useState } from 'react'
import { findCloseTag } from '../../lib/exercises'

// Toggle pills for an edit form's tags: tap an existing tag to add/remove
// it, or "+ New tag" to create one — never free text. allTags is the full
// shared vocabulary (exercises + exercise groups); selected is this item's
// own tags.
export default function TagPicker({ allTags, selected, onChange }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  function toggle(tag) {
    onChange(selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag])
  }

  function commitDraft() {
    const value = draft.trim().replace(/^#/, '')
    if (!value) {
      setAdding(false)
      setDraft('')
      return
    }
    const close = findCloseTag(allTags, value)
    const tag = close || value
    if (!selected.includes(tag)) onChange([...selected, tag])
    setDraft('')
    setAdding(false)
  }

  const closeMatch = draft.trim() ? findCloseTag(allTags.filter((t) => !selected.includes(t)), draft) : null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {allTags.map((tag) => (
        <button
          type="button"
          key={tag}
          className={`chip chip-btn${selected.includes(tag) ? ' selected' : ''}`}
          aria-pressed={selected.includes(tag)}
          onClick={() => toggle(tag)}
        >
          #{tag}
        </button>
      ))}

      {adding ? (
        <span className="chip-new-tag-input">
          <input
            type="text"
            autoFocus
            placeholder="New tag"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitDraft()
              } else if (e.key === 'Escape') {
                setAdding(false)
                setDraft('')
              }
            }}
            onBlur={commitDraft}
          />
          {closeMatch && <span className="tag-hint">Already exists: #{closeMatch}</span>}
        </span>
      ) : (
        <button type="button" className="chip chip-btn" onClick={() => setAdding(true)}>
          + New tag
        </button>
      )}
    </div>
  )
}
