import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { useConfirm } from '../../state/ConfirmContext.jsx'
import { usePrompt } from '../../state/PromptContext.jsx'
import { sessionTypeInfo } from '../../lib/taxonomy'
import { weekName } from '../../lib/planTree'

export default function WeekDetail({ path, block, week }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()
  const [templateId, setTemplateId] = useState('')
  const label = weekName(block, week)

  return (
    <div>
      <div className="detail-head">
        <div style={{ flex: 1 }}>
          <div className="subtle-label">Week</div>
          <div className="plan-title-input" style={{ padding: '4px 0', border: '1px solid transparent' }}>
            {label}
          </div>
        </div>
        <button
          className="btn btn-danger-text btn-sm"
          onClick={async () => {
            const n = week.sessions.length
            const ok = await confirm({ title: `Delete ${label}?`, description: `This removes ${n} session${n === 1 ? '' : 's'}.` })
            if (!ok) return
            dispatch({ type: 'NODE_DELETE', kind: 'week', parts: [path.phaseId, path.subId, path.blockId, week.id] })
            toast('Week deleted')
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
            onClick={async () => {
              const name = await prompt({ title: 'Name this session', label: 'Name', defaultValue: 'New Session' })
              if (!name) return
              dispatch({ type: 'SESSION_ADD', phaseId: path.phaseId, subId: path.subId, blockId: path.blockId, weekId: week.id, name })
            }}
          >
            + Add session
          </button>

          {state.savedSessions.length > 0 && (
            <>
              <select
                aria-label="Insert saved session"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                style={{ maxWidth: 200 }}
              >
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
