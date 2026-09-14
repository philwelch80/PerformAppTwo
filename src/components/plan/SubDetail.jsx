import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'

export default function SubDetail({ path, sub }) {
  const { dispatch } = useStore()
  const toast = useToast()

  return (
    <div>
      <div className="detail-head">
        <div style={{ flex: 1 }}>
          <div className="subtle-label">Subphase</div>
          <input
            type="text"
            className="plan-title-input"
            style={{ padding: '4px 0' }}
            value={sub.name}
            onChange={(e) => dispatch({ type: 'NODE_RENAME', kind: 'sub', parts: [path.phaseId, sub.id], name: e.target.value })}
          />
        </div>
        <button
          className="btn btn-danger-text btn-sm"
          onClick={() => {
            if (window.confirm('Delete this subphase? This also removes everything inside it.')) {
              dispatch({ type: 'NODE_DELETE', kind: 'sub', parts: [path.phaseId, sub.id] })
              toast('Subphase deleted')
            }
          }}
        >
          Delete subphase
        </button>
      </div>

      <div className="panel-pad">
        <div className="subtle-label">Blocks ({sub.blocks.length})</div>
        {sub.blocks.length === 0 ? (
          <div className="empty-state">No blocks yet.</div>
        ) : (
          <ul className="tree">
            {sub.blocks.map((block) => (
              <li key={block.id} className="tree-node">
                <div
                  className="tree-row"
                  onClick={() => dispatch({ type: 'SELECT', path: { phaseId: path.phaseId, subId: sub.id, blockId: block.id } })}
                >
                  <span className="tree-label">
                    {block.name}
                    <span className="tree-sub">{block.weeks.length} week{block.weeks.length === 1 ? '' : 's'}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <button className="btn btn-sm" style={{ marginTop: 10 }} onClick={() => dispatch({ type: 'BLOCK_ADD', phaseId: path.phaseId, subId: sub.id })}>
          + Add block
        </button>
      </div>
    </div>
  )
}
