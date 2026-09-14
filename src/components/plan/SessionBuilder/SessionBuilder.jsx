import { useStore } from '../../../state/StoreContext.jsx'
import { useToast } from '../../../state/ToastContext.jsx'
import { SESSION_TYPES } from '../../../lib/taxonomy'
import StrengthEditor from './StrengthEditor.jsx'
import ConditioningEditor from './ConditioningEditor.jsx'
import MobilityEditor from './MobilityEditor.jsx'

function hasContent(session) {
  if (session.type === 'strength') return session.data.groups.some((g) => g.items.length > 0)
  if (session.type === 'conditioning') return !!(session.data.description || session.data.pacing || session.data.targetValue)
  return session.data.items.length > 0
}

export default function SessionBuilder({ path, session }) {
  const { dispatch } = useStore()
  const toast = useToast()

  function setType(nextType) {
    if (nextType === session.type) return
    if (hasContent(session) && !window.confirm('Switching session type clears what you’ve entered for the current type. Continue?')) {
      return
    }
    dispatch({ type: 'SESSION_SET_TYPE', path, sessionType: nextType })
  }

  function saveAsTemplate() {
    const name = window.prompt('Name this saved session template', session.name)
    if (!name || !name.trim()) return
    dispatch({ type: 'SESSION_SAVE_AS_TEMPLATE', path, name: name.trim() })
    toast('Saved as a reusable session template')
  }

  return (
    <div>
      <div className="detail-head">
        <div style={{ flex: 1 }}>
          <div className="subtle-label">Session</div>
          <input
            type="text"
            className="plan-title-input"
            style={{ padding: '4px 0' }}
            value={session.name}
            onChange={(e) => dispatch({ type: 'SESSION_RENAME', path, name: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={saveAsTemplate}>
            Save as session template
          </button>
          <button
            className="btn btn-danger-text btn-sm"
            onClick={() => {
              if (window.confirm('Delete this session?')) {
                dispatch({
                  type: 'NODE_DELETE',
                  kind: 'session',
                  parts: [path.phaseId, path.subId, path.blockId, path.weekId, session.id],
                })
              }
            }}
          >
            Delete session
          </button>
        </div>
      </div>

      <div className="panel-pad">
        <div className="seg-control" role="tablist" aria-label="Session type">
          {SESSION_TYPES.map((t) => (
            <button key={t.id} className="seg-btn" role="tab" aria-pressed={session.type === t.id} onClick={() => setType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <hr className="divider" />

        {session.type === 'strength' && <StrengthEditor path={path} session={session} />}
        {session.type === 'conditioning' && <ConditioningEditor path={path} session={session} />}
        {session.type === 'mobility' && <MobilityEditor path={path} session={session} />}
      </div>
    </div>
  )
}
