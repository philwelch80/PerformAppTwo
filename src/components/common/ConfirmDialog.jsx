import Modal from './Modal.jsx'

// The shared yes/no confirmation — states what will be lost, with a count
// where the caller has one. Rendered by ConfirmProvider; see useConfirm().
export default function ConfirmDialog({ title, description, confirmLabel = 'Delete', cancelLabel = 'Cancel', danger = true, onConfirm, onCancel }) {
  return (
    <Modal onClose={onCancel} labelledBy="confirm-dialog-title">
      <div className="modal-head">
        <h3 id="confirm-dialog-title">{title}</h3>
      </div>
      {description && <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>{description}</p>}
      <div className="modal-actions">
        <button className="btn" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
