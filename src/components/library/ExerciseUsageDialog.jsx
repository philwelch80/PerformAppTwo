import Modal from '../common/Modal.jsx'

// Shown when deleting an in-use exercise: archiving is the only option in
// this slice ("Replace with another exercise" is a later slice).
export default function ExerciseUsageDialog({ exerciseName, usage, onArchive, onCancel }) {
  const sessionTotal = usage.sessionCount + usage.savedSessionCount

  const groupPart =
    usage.groupCount > 0 &&
    `${usage.groupCount} exercise group${usage.groupCount === 1 ? '' : 's'}${
      usage.groupNames.length > 0 ? ` (${usage.groupNames.join(', ')}${usage.groupCount > usage.groupNames.length ? ', …' : ''})` : ''
    }`
  const sessionPart =
    sessionTotal > 0 &&
    `${sessionTotal} session${sessionTotal === 1 ? '' : 's'}${
      usage.sessionNames.length > 0 ? ` (${usage.sessionNames.join(', ')}${sessionTotal > usage.sessionNames.length ? ', …' : ''})` : ''
    }`
  const parts = [groupPart, sessionPart].filter(Boolean)

  return (
    <Modal onClose={onCancel} labelledBy="usage-dialog-title">
      <div className="modal-head">
        <h3 id="usage-dialog-title">Archive &ldquo;{exerciseName}&rdquo;?</h3>
        <button className="btn btn-ghost" onClick={onCancel} aria-label="Close">
          ×
        </button>
      </div>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
        It&apos;s used in {parts.join(' and ')}, so it can&apos;t be deleted. Archiving hides it from the library and
        picker — it keeps working everywhere it&apos;s already used, and you can restore it later.
      </p>
      <div className="modal-actions">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={onArchive}>
          Archive
        </button>
      </div>
    </Modal>
  )
}
