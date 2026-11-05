import { useEffect, useState } from 'react'

// Same inline-error discipline as SetsInput, but the field is optional:
// empty commits null instead of showing an error. Used for plannedRpe
// (1-10) and plannedMinutes (1-999).
export default function OptionalIntegerInput({ value, min, max, onCommit, ariaLabel, placeholder }) {
  const [draft, setDraft] = useState(value == null ? '' : String(value))
  const [error, setError] = useState(false)

  useEffect(() => {
    setDraft(value == null ? '' : String(value))
    setError(false)
  }, [value])

  function commit() {
    const trimmed = draft.trim()
    if (trimmed === '') {
      setError(false)
      if (value !== null) onCommit(null)
      return
    }
    const n = Number(trimmed)
    if (!Number.isInteger(n) || n < min || n > max) {
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
        aria-label={ariaLabel}
        aria-invalid={error || undefined}
        placeholder={placeholder}
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
      {error && (
        <span className="field-error">
          {min}–{max}
        </span>
      )}
    </span>
  )
}
