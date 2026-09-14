import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { sessionTypeInfo } from '../../lib/taxonomy'

export default function WeekDetail({ path, week }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [templateId, setTemplateId] = useState('')

  return (
    <div>
      <div className="detail-head">
        <div style={{ flex: 1 }}>
          <div className="subtle-label">Week</div>
          <input
            type="text"
            className="plan-title-input"
            style={{ padding: '4px 0' }}
            value={week.name}
            onChange={(e) =>
              dispatch({ type: 'NODE_RENAME', kind: 'week', parts: [path.phaseId, path.subId, path.blockId, week.id], name: e.target.value })
            }
          />
        </div>
        <button
          className="btn btn-danger-text btn-sm"
          onClick={() => {
            if (window.confirm('Delete this week? This also removes its sessions.')) {
              dispatch({ type: 'NODE_DELETE', kind: 'week', parts: [path.phaseId, path.subId, path.blockId, week.id] })
              toast('Week deleted')
            }
          }}
        >
          Delete week
        </button>
      </div>

      <div className="panel-pad">
        <div className="field">
          <label>Focus (free text)</label>
          <input
            type="text"
            placeholder="e.g. Deload, Add volume, Test week…"
            value={week.focus}
            onChange={(e) =>
              dispatch({ type: 'WEEK_FOCUS_UPDATE', phaseId: path.phaseId, subId: path.subId, blockId: path.blockId, weekId: week.id, focus: e.target.value })
            }
          />
        </div>

        <hr className="divider" />

        <div className="subtle-label">Sessions ({week.sessions.length})</div>
        {week.sessions.length === 0 ? (
          <div className="empty-state">No sessions yet.</div>
        ) : (
          <ul className="tree">
            {week.sessions.map((session) => {
              const typeInfo = sessionTypeInfo(session.type)
              return (
                <li key={session.id} className="tree-node">
                  <div className="tree-row" onClick={() => dispatch({ type: 'SELECT', path: { ...path, weekId: week.id, sessionId: session.id } })}>
                    <span className={`session-type-dot ${typeInfo.dot}`} />
                    <span className="tree-label">{session.name}</span>
                    <span className={`type-badge ${typeInfo.badge}`}>{typeInfo.label}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button
            className="btn btn-sm"
            onClick={() => dispatch({ type: 'SESSION_ADD', phaseId: path.phaseId, subId: path.subId, blockId: path.blockId, weekId: week.id })}
          >
            + Add session
          </button>

          {state.savedSessions.length > 0 && (
            <>
              <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={{ maxWidth: 200 }}>
                <option value="">Insert saved session…</option>
                {state.savedSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-sm"
                disabled={!templateId}
                onClick={() => {
                  dispatch({
                    type: 'SAVED_SESSION_INSERT',
                    phaseId: path.phaseId,
                    subId: path.subId,
                    blockId: path.blockId,
                    weekId: week.id,
                    savedSessionId: templateId,
                  })
                  setTemplateId('')
                  toast('Saved session inserted')
                }}
              >
                Insert
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
