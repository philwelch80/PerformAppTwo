import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'

export default function BlockDetail({ path, block }) {
  const { dispatch } = useStore()
  const toast = useToast()

  return (
    <div>
      <div className="detail-head">
        <div style={{ flex: 1 }}>
          <div className="subtle-label">Block</div>
          <input
            type="text"
            className="plan-title-input"
            style={{ padding: '4px 0' }}
            value={block.name}
            onChange={(e) =>
              dispatch({ type: 'NODE_RENAME', kind: 'block', parts: [path.phaseId, path.subId, block.id], name: e.target.value })
            }
          />
        </div>
        <button
          className="btn btn-danger-text btn-sm"
          onClick={() => {
            if (window.confirm('Delete this block? This also removes everything inside it.')) {
              dispatch({ type: 'NODE_DELETE', kind: 'block', parts: [path.phaseId, path.subId, block.id] })
              toast('Block deleted')
            }
          }}
        >
          Delete block
        </button>
      </div>

      <div className="panel-pad">
        <div className="subtle-label">Weeks ({block.weeks.length})</div>
        {block.weeks.length === 0 ? (
          <div className="empty-state">No weeks yet.</div>
        ) : (
          <ul className="tree">
            {block.weeks.map((week) => (
              <li key={week.id} className="tree-node">
                <div
                  className="tree-row"
                  onClick={() => dispatch({ type: 'SELECT', path: { ...path, weekId: week.id } })}
                >
                  <span className="tree-label">
                    {week.name}
                    <span className="tree-sub">{week.focus || `${week.sessions.length} session${week.sessions.length === 1 ? '' : 's'}`}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button
          className="btn btn-sm"
          style={{ marginTop: 10 }}
          onClick={() => dispatch({ type: 'WEEK_ADD', phaseId: path.phaseId, subId: path.subId, blockId: block.id })}
        >
          + Add week
        </button>
      </div>
    </div>
  )
}
