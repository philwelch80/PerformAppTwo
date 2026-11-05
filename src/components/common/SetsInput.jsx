import { useEffect, useState } from 'react'

// Lets the sets box go empty while typing, parses on blur, and shows an
// inline error instead of silently coercing or saving an out-of-range
// value. Sets are always an integer 1-99.
export default function SetsInput({ value, onCommit }) {
  const [draft, setDraft] = useState(String(value))
  const [error, setError] = useState(false)

  useEffect(() => {
    setDraft(String(value))
    setError(false)
  }, [value])

  function commit() {
    const trimmed = draft.trim()
    const n = Number(trimmed)
    if (trimmed === '' || !Number.isInteger(n) || n < 1 || n > 99) {
      setError(true)
      return
    }
    setError(false)
    if (n !== value) onCommit(n)
  }

  return (
    <span className="sets-input-wrap">
      <input
        type="text"
        inputMode="numeric"
        aria-label="Sets"
        aria-invalid={error || undefined}
        className={error ? 'input-error' : ''}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setError(false)
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
      />
      {error && <span className="field-error">1–99</span>}
    </span>
  )
}
