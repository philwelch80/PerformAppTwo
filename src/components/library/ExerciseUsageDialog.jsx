// Shown when deleting an in-use exercise: archiving is the only option in
// this slice ("Replace with another exercise" is a later slice).
export default function ExerciseUsageDialog({ exerciseName, usage, onArchive, onCancel }) {
  const parts = []
  if (usage.groupCount > 0) parts.push(`${usage.groupCount} exercise group${usage.groupCount === 1 ? '' : 's'}`)
  const sessionTotal = usage.sessionCount + usage.savedSessionCount
  if (sessionTotal > 0) parts.push(`${sessionTotal} session${sessionTotal === 1 ? '' : 's'}`)

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-head">
          <h3>Can&apos;t delete &ldquo;{exerciseName}&rdquo;</h3>
          <button className="btn btn-ghost" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
          It&apos;s used in {parts.join(' and ')}
          {usage.groupNames.length > 0 && ` (${usage.groupNames.join(', ')}${usage.groupCount > usage.groupNames.length ? ', …' : ''})`}.
          Archiving hides it from the library and picker — it keeps working everywhere it&apos;s already used, and you can restore it later.
        </p>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onArchive}>
            Archive
          </button>
        </div>
      </div>
    </div>
  )
}
