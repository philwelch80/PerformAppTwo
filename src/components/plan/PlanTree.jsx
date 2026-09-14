import { useRef } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { sessionTypeInfo } from '../../lib/taxonomy'

const KIND_LABEL = { phase: 'Phase', sub: 'Subphase', block: 'Block', week: 'Week', session: 'Session' }
const HAS_CHILDREN = { phase: true, sub: true, block: true, week: true, session: false }

function isSelected(selectedPath, idKey, id) {
  return !!selectedPath && selectedPath[idKey] === id
}

export default function PlanTree() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const dragCtx = useRef(null)
  const { plan, expanded, selectedPath } = state

  function select(path) {
    dispatch({ type: 'SELECT', path })
  }
  function toggle(id) {
    dispatch({ type: 'TOGGLE_EXPAND', id })
  }
  function rename(kind, parts, currentName) {
    const next = window.prompt(`Rename ${KIND_LABEL[kind].toLowerCase()}`, currentName)
    if (next !== null && next.trim()) dispatch({ type: 'NODE_RENAME', kind, parts, name: next.trim() })
  }
  function remove(kind, parts) {
    if (HAS_CHILDREN[kind] && !window.confirm(`Delete this ${KIND_LABEL[kind].toLowerCase()}? This also removes everything inside it.`)) {
      return
    }
    dispatch({ type: 'NODE_DELETE', kind, parts })
    toast(`${KIND_LABEL[kind]} deleted`)
  }

  function onWeekDragStart(key) {
    dragCtx.current = { kind: 'week', key }
  }
  function onSessionDragStart(key) {
    dragCtx.current = { kind: 'session', key }
  }
  function onWeekDrop(ids, targetWeekId) {
    if (dragCtx.current?.kind !== 'week') return
    dispatch({
      type: 'WEEKS_REORDER',
      phaseId: ids.phaseId,
      subId: ids.subId,
      blockId: ids.blockId,
      fromWeekId: dragCtx.current.key,
      toWeekId: targetWeekId,
    })
    dragCtx.current = null
  }
  function onSessionDrop(ids, targetSessionId) {
    if (dragCtx.current?.kind !== 'session') return
    dispatch({
      type: 'SESSIONS_REORDER',
      phaseId: ids.phaseId,
      subId: ids.subId,
      blockId: ids.blockId,
      weekId: ids.weekId,
      fromSessionId: dragCtx.current.key,
      toSessionId: targetSessionId,
    })
    dragCtx.current = null
  }

  return (
    <div className="panel tree-panel">
      <div className="tree-head">
        <input
          type="text"
          className="plan-title-input"
          value={plan.name}
          onChange={(e) => dispatch({ type: 'PLAN_RENAME', name: e.target.value })}
        />
      </div>

      <ul className="tree tree-level-plan">
        {plan.phases.map((phase) => {
          const pExpanded = !!expanded[phase.id]
          return (
            <li className="tree-node" key={phase.id}>
              <div
                className={`tree-row${isSelected(selectedPath, 'phaseId', phase.id) ? ' selected' : ''}`}
                onClick={() => select({ phaseId: phase.id })}
              >
                <button className="disclosure" onClick={(e) => { e.stopPropagation(); toggle(phase.id) }}>
                  {pExpanded ? '▼' : '▶'}
                </button>
                <span className="tree-label">
                  {phase.name}
                  <span className="tree-sub">Phase</span>
                </span>
                <span className="tree-row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); rename('phase', [phase.id], phase.name) }}>
                    Rename
                  </button>
                  <button className="btn btn-ghost btn-sm btn-danger-text" onClick={(e) => { e.stopPropagation(); remove('phase', [phase.id]) }}>
                    Delete
                  </button>
                </span>
              </div>

              {pExpanded && (
                <div className="tree-children">
                  {phase.subphases.map((sub) => {
                    const sExpanded = !!expanded[sub.id]
                    return (
                      <div className="tree-node" key={sub.id}>
                        <div
                          className={`tree-row${isSelected(selectedPath, 'subId', sub.id) ? ' selected' : ''}`}
                          onClick={() => select({ phaseId: phase.id, subId: sub.id })}
                        >
                          <button className="disclosure" onClick={(e) => { e.stopPropagation(); toggle(sub.id) }}>
                            {sExpanded ? '▼' : '▶'}
                          </button>
                          <span className="tree-label">
                            {sub.name}
                            <span className="tree-sub">Subphase</span>
                          </span>
                          <span className="tree-row-actions">
                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); rename('sub', [phase.id, sub.id], sub.name) }}>
                              Rename
                            </button>
                            <button className="btn btn-ghost btn-sm btn-danger-text" onClick={(e) => { e.stopPropagation(); remove('sub', [phase.id, sub.id]) }}>
                              Delete
                            </button>
                          </span>
                        </div>

                        {sExpanded && (
                          <div className="tree-children">
                            {sub.blocks.map((block) => {
                              const bExpanded = !!expanded[block.id]
                              return (
                                <div className="tree-node" key={block.id}>
                                  <div
                                    className={`tree-row${isSelected(selectedPath, 'blockId', block.id) ? ' selected' : ''}`}
                                    onClick={() => select({ phaseId: phase.id, subId: sub.id, blockId: block.id })}
                                  >
                                    <button className="disclosure" onClick={(e) => { e.stopPropagation(); toggle(block.id) }}>
                                      {bExpanded ? '▼' : '▶'}
                                    </button>
                                    <span className="tree-label">
                                      {block.name}
                                      <span className="tree-sub">Block</span>
                                    </span>
                                    <span className="tree-row-actions">
                                      <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={(e) => { e.stopPropagation(); rename('block', [phase.id, sub.id, block.id], block.name) }}
                                      >
                                        Rename
                                      </button>
                                      <button
                                        className="btn btn-ghost btn-sm btn-danger-text"
                                        onClick={(e) => { e.stopPropagation(); remove('block', [phase.id, sub.id, block.id]) }}
                                      >
                                        Delete
                                      </button>
                                    </span>
                                  </div>

                                  {bExpanded && (
                                    <div className="tree-children">
                                      {block.weeks.map((week) => {
                                        const wExpanded = !!expanded[week.id]
                                        const ids = { phaseId: phase.id, subId: sub.id, blockId: block.id }
                                        return (
                                          <div
                                            className="tree-node"
                                            key={week.id}
                                            draggable
                                            onDragStart={() => onWeekDragStart(week.id)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => { e.preventDefault(); onWeekDrop(ids, week.id) }}
                                          >
                                            <div
                                              className={`tree-row${isSelected(selectedPath, 'weekId', week.id) ? ' selected' : ''}`}
                                              onClick={() => select({ ...ids, weekId: week.id })}
                                            >
                                              <span className="drag-handle" title="Drag to reorder within this block">⋮⋮</span>
                                              <button className="disclosure" onClick={(e) => { e.stopPropagation(); toggle(week.id) }}>
                                                {wExpanded ? '▼' : '▶'}
                                              </button>
                                              <span className="tree-label">
                                                {week.name}
                                                <span className="tree-sub">{week.focus || ''}</span>
                                              </span>
                                              <span className="tree-row-actions">
                                                <button
                                                  className="btn btn-ghost btn-sm"
                                                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'WEEK_COPY', ...ids, weekId: week.id }); toast('Week duplicated into the next slot') }}
                                                >
                                                  Copy
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); rename('week', [phase.id, sub.id, block.id, week.id], week.name) }}>
                                                  Rename
                                                </button>
                                                <button
                                                  className="btn btn-ghost btn-sm btn-danger-text"
                                                  onClick={(e) => { e.stopPropagation(); remove('week', [phase.id, sub.id, block.id, week.id]) }}
                                                >
                                                  Delete
                                                </button>
                                              </span>
                                            </div>

                                            {wExpanded && (
                                              <div className="tree-children">
                                                {week.sessions.map((session) => {
                                                  const typeInfo = sessionTypeInfo(session.type)
                                                  return (
                                                    <div
                                                      className="tree-node"
                                                      key={session.id}
                                                      draggable
                                                      onDragStart={() => onSessionDragStart(session.id)}
                                                      onDragOver={(e) => e.preventDefault()}
                                                      onDrop={(e) => { e.preventDefault(); onSessionDrop({ ...ids, weekId: week.id }, session.id) }}
                                                    >
                                                      <div
                                                        className={`tree-row${isSelected(selectedPath, 'sessionId', session.id) ? ' selected' : ''}`}
                                                        onClick={() => select({ ...ids, weekId: week.id, sessionId: session.id })}
                                                      >
                                                        <span className="drag-handle" title="Drag to reorder within this week">⋮⋮</span>
                                                        <span className={`session-type-dot ${typeInfo.dot}`} />
                                                        <span className="tree-label">{session.name}</span>
                                                        <span className="tree-row-actions">
                                                          <button
                                                            className="btn btn-ghost btn-sm btn-danger-text"
                                                            onClick={(e) => { e.stopPropagation(); remove('session', [phase.id, sub.id, block.id, week.id, session.id]) }}
                                                          >
                                                            Delete
                                                          </button>
                                                        </span>
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                                <div className="tree-add-row">
                                                  <button onClick={() => dispatch({ type: 'SESSION_ADD', ...ids, weekId: week.id })}>+ Add session</button>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                      <div className="tree-add-row">
                                        <button
                                          onClick={() => {
                                            dispatch({ type: 'WEEK_ADD', phaseId: phase.id, subId: sub.id, blockId: block.id })
                                            toast('Week added — plan extended without touching earlier weeks')
                                          }}
                                        >
                                          + Add week
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            <div className="tree-add-row">
                              <button onClick={() => dispatch({ type: 'BLOCK_ADD', phaseId: phase.id, subId: sub.id })}>+ Add block</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <div className="tree-add-row">
                    <button onClick={() => dispatch({ type: 'SUB_ADD', phaseId: phase.id })}>+ Add subphase</button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="tree-add-row" style={{ paddingLeft: 6, borderTop: '1px solid var(--line)', marginTop: 6, paddingTop: 10 }}>
        <button className="btn" onClick={() => dispatch({ type: 'PHASE_ADD' })}>
          + Add phase (extend plan)
        </button>
      </div>
    </div>
  )
}
