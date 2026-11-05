import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import SessionBuilder from '../plan/SessionBuilder/SessionBuilder.jsx'
import Modal from '../common/Modal.jsx'

// Edits a saved session template in place, reusing the plan session builder
// against path = { savedSessionId } (see reducer.js's sessionAt).
export default function SavedSessionModal({ sessionId, onClose }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const session = state.savedSessions.find((s) => s.id === sessionId)
  if (!session) return null

  return (
    <Modal onClose={onClose} className="panel modal-flush" maxWidth={640} labelledBy="saved-session-title">
      <h2 id="saved-session-title" className="sr-only">
        Edit saved session: {session.name}
      </h2>
      <SessionBuilder
        path={{ savedSessionId: sessionId }}
        session={session}
        hideSaveAsTemplate
        onDelete={() => {
          dispatch({ type: 'SAVED_SESSION_DELETE', id: sessionId })
          toast('Saved session deleted')
          onClose()
        }}
      />
      <div className="modal-actions" style={{ padding: '0 16px 16px' }}>
        <button className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  )
}
