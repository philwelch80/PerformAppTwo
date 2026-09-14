import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { sessionTypeInfo } from '../../lib/taxonomy'

function exerciseName(exercises, id) {
  return exercises.find((e) => e.id === id)?.name || '(deleted exercise)'
}

export default function ReusableBlocks() {
  const { state, dispatch } = useStore()
  const toast = useToast()

  return (
    <div>
      <div className="reuse-section">
        <h3 style={{ marginBottom: 10 }}>Session blocks</h3>
        <div className="topbar-note" style={{ marginBottom: 12 }}>
          Saved from a strength group (e.g. a standard warm-up) — one level below a full session, ready to drop into any session.
        </div>
        {state.sessionBlocks.length === 0 ? (
          <div className="empty-state">
            None yet. From a strength session, build a group and use &ldquo;Save as session block&rdquo;.
          </div>
        ) : (
          <div className="reuse-grid">
            {state.sessionBlocks.map((b) => (
              <div className="panel reuse-card" key={b.id}>
                <div className="reuse-card-head">
                  <span className="ex-name">{b.name}</span>
                  <button
                    className="btn btn-ghost btn-sm btn-danger-text"
                    onClick={() => {
                      dispatch({ type: 'SESSION_BLOCK_DELETE', id: b.id })
                      toast('Session block removed')
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="ex-desc">
                  {b.items.map((item, i) => (
                    <div key={i}>
                      {exerciseName(state.exercises, item.exerciseId)} — {item.sets}×{item.reps}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="reuse-section">
        <h3 style={{ marginBottom: 10 }}>Saved session templates</h3>
        <div className="topbar-note" style={{ marginBottom: 12 }}>
          A full session saved for reuse — insert a copy into any week from the week&apos;s detail panel.
        </div>
        {state.savedSessions.length === 0 ? (
          <div className="empty-state">
            None yet. From within a session, use &ldquo;Save as session template&rdquo;.
          </div>
        ) : (
          <div className="reuse-grid">
            {state.savedSessions.map((s) => {
              const typeInfo = sessionTypeInfo(s.type)
              return (
                <div className="panel reuse-card" key={s.id}>
                  <div className="reuse-card-head">
                    <span className="ex-name">{s.name}</span>
                    <button
                      className="btn btn-ghost btn-sm btn-danger-text"
                      onClick={() => {
                        dispatch({ type: 'SAVED_SESSION_DELETE', id: s.id })
                        toast('Saved session removed')
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <span className={`type-badge ${typeInfo.badge}`}>{typeInfo.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
