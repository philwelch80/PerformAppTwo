import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { useConfirm } from '../../state/ConfirmContext.jsx'
import { usePrompt } from '../../state/PromptContext.jsx'
import { sessionTypeInfo } from '../../lib/taxonomy'
import { weekName } from '../../lib/planTree'

const KIND_LABEL = { phase: 'Phase', sub: 'Subphase', block: 'Block', week: 'Week', session: 'Session' }
const HAS_CHILDREN = { phase: true, sub: true, block: true, week: true, session: false }

// A row is the actual selection only once nothing deeper is also named in
// the path; otherwise it's just on the path to the selection, and gets a
// subtler style so the real target stays the only one that reads as
// "selected".
function isLeafSelected(selectedPath, idKey, id, deeperKey) {
  if (!selectedPath || selectedPath[idKey] !== id) return false
  return !deeperKey || !selectedPath[deeperKey]
}
function isAncestorSelected(selectedPath, idKey, id, deeperKey) {
  if (!selectedPath || selectedPath[idKey] !== id) return false
  return !!(deeperKey && selectedPath[deeperKey])
}
function rowClass(selectedPath, idKey, id, deeperKey) {
  if (isLeafSelected(selectedPath, idKey, id, deeperKey)) return ' selected'
  if (isAncestorSelected(selectedPath, idKey, id, deeperKey)) return ' ancestor-selected'
  return ''
}

export default function PlanTree() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()
  const dragCtx = useRef(null)
  const { plan, expanded, selectedPath } = state
  const [openWeekMenu, setOpenWeekMenu] = useState(null)
  const weekMenuRef = useRef(null)

  useEffect(() => {
    if (!openWeekMenu) return
    function onDocMouseDown(e) {
      if (weekMenuRef.current && !weekMenuRef.current.contains(e.target)) setOpenWeekMenu(null)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpenWeekMenu(null)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [openWeekMenu])

  function select(path) {
    dispatch({ type: 'SELECT', path })
  }
  function toggle(id) {
    dispatch({ type: 'TOGGLE_EXPAND', id })
  }
  async function rename(kind, parts, currentName) {
    const next = await prompt({ title: `Rename ${KIND_LABEL[kind].toLowerCase()}`, label: 'Name', defaultValue: currentName })
    if (next) dispatch({ type: 'NODE_RENAME', kind, parts, name: next })
  }
  async function remove(kind, parts, { title, description } = {}) {
    if (HAS_CHILDREN[kind]) {
      const ok = await confirm({ title: title || `Delete this ${KIND_LABEL[kind].toLowerCase()}?`, description })
      if (!ok) return
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
              <div className={`tree-row${rowClass(selectedPath, 'phaseId', phase.id, 'subId')}`}>
                <button
                  className="disclosure"
                  aria-label={`${pExpanded ? 'Collapse' : 'Expand'} ${phase.name}`}
                  aria-expanded={pExpanded}
                  onClick={(e) => { e.stopPropagation(); toggle(phase.id) }}
                >
                  {pExpanded ? '▼' : '▶'}
                </button>
                <button type="button" className="tree-row-select" onClick={() => select({ phaseId: phase.id })}>
                  <span className="tree-label">
                    {phase.name}
                    <span className="tree-sub">Phase</span>
                  </span>
                </button>
                <span className="tree-row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); rename('phase', [phase.id], phase.name) }}>
                    Rename
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-danger-text"
                    onClick={(e) => {
                      e.stopPropagation()
                      const n = phase.subphases.length
                      remove('phase', [phase.id], { title: `Delete "${phase.name}"?`, description: `This removes ${n} subphase${n === 1 ? '' : 's'}.` })
                    }}
                  >
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
                        <div className={`tree-row${rowClass(selectedPath, 'subId', sub.id, 'blockId')}`}>
                          <button
                            className="disclosure"
                            aria-label={`${sExpanded ? 'Collapse' : 'Expand'} ${sub.name}`}
                            aria-expanded={sExpanded}
                            onClick={(e) => { e.stopPropagation(); toggle(sub.id) }}
                          >
                            {sExpanded ? '▼' : '▶'}
                          </button>
                          <button type="button" className="tree-row-select" onClick={() => select({ phaseId: phase.id, subId: sub.id })}>
                            <span className="tree-label">
                              {sub.name}
                              <span className="tree-sub">Subphase</span>
                            </span>
                          </button>
                          <span className="tree-row-actions">
                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); rename('sub', [phase.id, sub.id], sub.name) }}>
                              Rename
                            </button>
                            <button
                              className="btn btn-ghost btn-sm btn-danger-text"
                              onClick={(e) => {
                                e.stopPropagation()
                                const n = sub.blocks.length
                                remove('sub', [phase.id, sub.id], { title: `Delete "${sub.name}"?`, description: `This removes ${n} block${n === 1 ? '' : 's'}.` })
                              }}
                            >
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
                                  <div className={`tree-row${rowClass(selectedPath, 'blockId', block.id, 'weekId')}`}>
                                    <button
                                      className="disclosure"
                                      aria-label={`${bExpanded ? 'Collapse' : 'Expand'} ${block.name}`}
                                      aria-expanded={bExpanded}
                                      onClick={(e) => { e.stopPropagation(); toggle(block.id) }}
                                    >
                                      {bExpanded ? '▼' : '▶'}
                                    </button>
                                    <button
                                      type="button"
                                      className="tree-row-select"
                                      onClick={() => select({ phaseId: phase.id, subId: sub.id, blockId: block.id })}
                                    >
                                      <span className="tree-label">
                                        {block.name}
                                        <span className="tree-sub">Block</span>
                                      </span>
                                    </button>
                                    <span className="tree-row-actions">
                                      <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={(e) => { e.stopPropagation(); rename('block', [phase.id, sub.id, block.id], block.name) }}
                                      >
                                        Rename
                                      </button>
                                      <button
                                        className="btn btn-ghost btn-sm btn-danger-text"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          const n = block.weeks.length
                                          remove('block', [phase.id, sub.id, block.id], { title: `Delete "${block.name}"?`, description: `This removes ${n} week${n === 1 ? '' : 's'}.` })
                                        }}
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
                                        const label = weekName(block, week)
                                        return (
                                          <div
                                            className="tree-node"
                                            key={week.id}
                                            draggable
                                            onDragStart={() => onWeekDragStart(week.id)}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => { e.preventDefault(); onWeekDrop(ids, week.id) }}
                                          >
                                            <div className={`tree-row${rowClass(selectedPath, 'weekId', week.id, 'sessionId')}`}>
                                              <span className="drag-handle" title="Drag to reorder within this block">⋮⋮</span>
                                              <button
                                                className="disclosure"
                                                aria-label={`${wExpanded ? 'Collapse' : 'Expand'} ${label}`}
                                                aria-expanded={wExpanded}
                                                onClick={(e) => { e.stopPropagation(); toggle(week.id) }}
                                              >
                                                {wExpanded ? '▼' : '▶'}
                                              </button>
                                              <button
                                                type="button"
                                                className="tree-row-select"
                                                onClick={() => select({ ...ids, weekId: week.id })}
                                                title={week.focus || undefined}
                                              >
                                                <span className="tree-label">
                                                  {label}
                                                  <span className="tree-sub">{week.focus || ''}</span>
                                                </span>
                                              </button>
                                              <span
                                                className="tree-row-actions"
                                                ref={openWeekMenu === week.id ? weekMenuRef : null}
                                                style={openWeekMenu === week.id ? { display: 'flex' } : undefined}
                                              >
                                                <button
                                                  className="btn btn-ghost btn-sm kebab-btn"
                                                  aria-label={`${label} actions`}
                                                  aria-haspopup="true"
                                                  aria-expanded={openWeekMenu === week.id}
                                                  onClick={(e) => { e.stopPropagation(); setOpenWeekMenu(openWeekMenu === week.id ? null : week.id) }}
                                                >
                                                  ⋮
                                                </button>
                                                {openWeekMenu === week.id && (
                                                  <div className="row-menu" role="menu">
                                                    <button
                                                      role="menuitem"
                                                      className="row-menu-item"
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenWeekMenu(null)
                                                        dispatch({ type: 'WEEK_COPY', ...ids, weekId: week.id })
                                                        toast('Week duplicated into the next slot')
                                                      }}
                                                    >
                                                      Copy
                                                    </button>
                                                    <button
                                                      role="menuitem"
                                                      className="row-menu-item row-menu-item-danger"
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenWeekMenu(null)
                                                        const n = week.sessions.length
                                                        remove('week', [phase.id, sub.id, block.id, week.id], {
                                                          title: `Delete ${label}?`,
                                                          description: `This removes ${n} session${n === 1 ? '' : 's'}.`,
                                                        })
                                                      }}
                                                    >
                                                      Delete
                                                    </button>
                                                  </div>
                                                )}
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
                                                      <div className={`tree-row${rowClass(selectedPath, 'sessionId', session.id)}`}>
                                                        <span className="drag-handle" title="Drag to reorder within this week">⋮⋮</span>
                                                        <button
                                                          type="button"
                                                          className="tree-row-select"
                                                          onClick={() => select({ ...ids, weekId: week.id, sessionId: session.id })}
                                                        >
                                                          <span className={`session-type-dot ${typeInfo.dot}`} />
                                                          <span className="session-type-letter">{typeInfo.letter}</span>
                                                          <span className="tree-label">{session.name}</span>
                                                        </button>
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
                                                  <button
                                                    onClick={async () => {
                                                      const name = await prompt({ title: 'Name this session', label: 'Name', defaultValue: 'New Session' })
                                                      if (!name) return
                                                      dispatch({ type: 'SESSION_ADD', ...ids, weekId: week.id, name })
                                                    }}
                                                  >
                                                    + Add session
                                                  </button>
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
