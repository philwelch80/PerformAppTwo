import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import SessionBuilder from '../plan/SessionBuilder/SessionBuilder.jsx'

// Edits a saved session template in place, reusing the plan session builder
// against path = { savedSessionId } (see reducer.js's sessionAt).
export default function SavedSessionModal({ sessionId, onClose }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const session = state.savedSessions.find((s) => s.id === sessionId)
  if (!session) return null

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal panel" style={{ maxWidth: 640, padding: 0 }}>
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
      </div>
    </div>
  )
}
