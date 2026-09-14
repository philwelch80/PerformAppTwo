import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'

export default function PhaseDetail({ phase }) {
  const { dispatch } = useStore()
  const toast = useToast()

  return (
    <div>
      <div className="detail-head">
        <div style={{ flex: 1 }}>
          <div className="subtle-label">Phase</div>
          <input
            type="text"
            className="plan-title-input"
            style={{ padding: '4px 0' }}
            value={phase.name}
            onChange={(e) => dispatch({ type: 'NODE_RENAME', kind: 'phase', parts: [phase.id], name: e.target.value })}
          />
        </div>
        <button
          className="btn btn-danger-text btn-sm"
          onClick={() => {
            if (window.confirm('Delete this phase? This also removes everything inside it.')) {
              dispatch({ type: 'NODE_DELETE', kind: 'phase', parts: [phase.id] })
              toast('Phase deleted')
            }
          }}
        >
          Delete phase
        </button>
      </div>

      <div className="panel-pad">
        <div className="subtle-label">Subphases ({phase.subphases.length})</div>
        {phase.subphases.length === 0 ? (
          <div className="empty-state">No subphases yet.</div>
        ) : (
          <ul className="tree">
            {phase.subphases.map((sub) => (
              <li key={sub.id} className="tree-node">
                <div
                  className="tree-row"
                  onClick={() => dispatch({ type: 'SELECT', path: { phaseId: phase.id, subId: sub.id } })}
                >
                  <span className="tree-label">
                    {sub.name}
                    <span className="tree-sub">{sub.blocks.length} block{sub.blocks.length === 1 ? '' : 's'}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => dispatch({ type: 'SUB_ADD', phaseId: phase.id })}>
          + Add subphase
        </button>
      </div>
    </div>
  )
}
