import { useMemo, useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { weekName } from '../../lib/planTree'
import { sessionTypeInfo } from '../../lib/taxonomy'

// Flattens the plan into weeks in order, each carrying its ancestors — the
// season strip and block grid both need this same linear view the tree
// otherwise only implies through nesting.
function flattenWeeks(plan) {
  const rows = []
  plan.phases.forEach((phase) => {
    phase.subphases.forEach((sub) => {
      sub.blocks.forEach((block) => {
        block.weeks.forEach((week) => {
          rows.push({ phase, sub, block, week })
        })
      })
    })
  })
  return rows
}

// Re-groups the flattened weeks back into their blocks, in order, each
// carrying its absolute week-number range across the whole plan (for the
// block header's "Weeks X-Y").
function groupByBlock(weekRows) {
  const blocks = []
  let currentBlockId = null
  weekRows.forEach((row, i) => {
    if (row.block.id !== currentBlockId) {
      currentBlockId = row.block.id
      blocks.push({ phase: row.phase, sub: row.sub, block: row.block, weeks: [], startWeekNumber: i + 1 })
    }
    blocks[blocks.length - 1].weeks.push({ ...row, weekNumber: i + 1 })
  })
  return blocks
}

// One flex-basis-weighted segment per run of same-phase weeks, for the
// season strip's phase band.
function phaseSegments(weekRows) {
  const segments = []
  weekRows.forEach((row) => {
    const last = segments[segments.length - 1]
    if (last && last.phase.id === row.phase.id) last.count += 1
    else segments.push({ phase: row.phase, count: 1 })
  })
  return segments
}

export default function PlanOverview() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const { plan } = state
  const weekRows = useMemo(() => flattenWeeks(plan), [plan])
  const blocks = useMemo(() => groupByBlock(weekRows), [weekRows])
  const segments = useMemo(() => phaseSegments(weekRows), [weekRows])
  // Per-viewer only: which blocks are collapsed. Unset means "default for
  // its position" (only the first/current block starts open), not "closed".
  const [collapsedOverrides, setCollapsedOverrides] = useState({})

  function isCollapsed(blockId, index) {
    if (blockId in collapsedOverrides) return collapsedOverrides[blockId]
    return index !== 0
  }
  function toggleBlock(blockId, index) {
    setCollapsedOverrides((c) => ({ ...c, [blockId]: !isCollapsed(blockId, index) }))
  }
  function jumpToWeek(weekId) {
    document.getElementById(`overview-week-${weekId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  function addWeekAtEnd() {
    const last = blocks[blocks.length - 1]
    if (!last) return
    dispatch({ type: 'WEEK_ADD', phaseId: last.phase.id, subId: last.sub.id, blockId: last.block.id })
    toast('Week added — plan extended without touching earlier weeks')
  }

  if (weekRows.length === 0) {
    return (
      <div className="detail-empty">
        <div>No weeks yet.</div>
        <div style={{ fontSize: 12 }}>Switch to Outline and use &ldquo;+ Add phase&rdquo; to start the plan.</div>
      </div>
    )
  }

  return (
    <div className="plan-overview">
      <div className="panel panel-pad season-strip">
        <div className="season-strip-head">
          <span className="subtle-label" style={{ marginBottom: 0 }}>
            Season · {weekRows.length} week{weekRows.length === 1 ? '' : 's'} · Planned load
          </span>
          <span className="ex-desc">Click a week to jump.</span>
        </div>
        <div className="season-strip-bars">
          {weekRows.map((row, i) => (
            <button
              key={row.week.id}
              type="button"
              className="season-bar"
              onClick={() => jumpToWeek(row.week.id)}
              title={`Week ${i + 1} · ${row.block.name}`}
              aria-label={`Jump to week ${i + 1}`}
            />
          ))}
        </div>
        <div className="season-strip-numbers">
          {weekRows.map((row, i) => (
            <span key={row.week.id} className="season-strip-number">
              {i + 1}
            </span>
          ))}
        </div>
        <div className="season-strip-phases">
          {segments.map((seg, i) => (
            <div key={i} className="season-strip-phase" style={{ flexGrow: seg.count }}>
              {seg.phase.name}
            </div>
          ))}
        </div>
      </div>

      <div className="block-grid">
        {blocks.map((b, blockIndex) => {
          const open = !isCollapsed(b.block.id, blockIndex)
          const sessionCount = b.weeks.reduce((n, w) => n + w.week.sessions.length, 0)
          const weekRange = b.weeks.length === 1 ? `Week ${b.startWeekNumber}` : `Weeks ${b.startWeekNumber}-${b.startWeekNumber + b.weeks.length - 1}`
          return (
            <div className="panel block-grid-section" key={b.block.id}>
              <button type="button" className="block-grid-header" aria-expanded={open} onClick={() => toggleBlock(b.block.id, blockIndex)}>
                <span className="disclosure">{open ? '▼' : '▶'}</span>
                <span className="block-grid-title">{b.block.name}</span>
                <span className="block-grid-context">
                  {weekRange} · {b.phase.name} › {b.sub.name}
                </span>
                <span className="block-grid-meta">
                  {!open && `${b.weeks.length} week${b.weeks.length === 1 ? '' : 's'} · ${sessionCount} session${sessionCount === 1 ? '' : 's'}`}
                </span>
              </button>

              {open && (
                <div className="block-grid-rows">
                  {b.weeks.map((w) => (
                    <div className="block-grid-row" id={`overview-week-${w.week.id}`} key={w.week.id}>
                      <div className="block-grid-week-col">
                        <div className="block-grid-week-name">{weekName(b.block, w.week)}</div>
                        {w.week.focus && <div className="ex-desc">{w.week.focus}</div>}
                      </div>
                      <div className="block-grid-sessions-cell">
                        {w.week.sessions.length === 0 ? (
                          <span className="ex-desc">No sessions</span>
                        ) : (
                          w.week.sessions.map((s) => {
                            const t = sessionTypeInfo(s.type)
                            return (
                              <span className={`type-badge ${t.badge}`} key={s.id}>
                                <span className="type-badge-letter">{t.letter}</span>
                                {s.name}
                              </span>
                            )
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div className="tree-add-row" style={{ paddingLeft: 0 }}>
          <button className="btn" onClick={addWeekAtEnd}>
            + Add week at end
          </button>
        </div>
      </div>
    </div>
  )
}
