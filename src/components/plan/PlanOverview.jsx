import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { weekName } from '../../lib/planTree'
import { SESSION_TYPES, sessionTypeInfo } from '../../lib/taxonomy'
import { DAY_ABBR, DAY_NAMES, currentBlockIndex, todayISO, weekLoad } from '../../lib/schedule'
import QuickViewPanel from './QuickViewPanel.jsx'

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

function formatTime(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

// A session's card in a grid cell or the unscheduled area. Draggable, and
// carries a "Move to..." menu as the keyboard/non-drag alternative to drag
// (parking lot S2 — drag itself still needs a manual test pass). Manages
// its own outside-click-closes-menu handling so it works the same whether
// it's rendered in a grid cell or the unscheduled area.
function SessionChip({ session, daySlots, selected, menuOpen, onOpenMenu, onCloseMenu, onOpenSession, onSchedule, onDragStart }) {
  const t = sessionTypeInfo(session.type)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function onDocMouseDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) onCloseMenu()
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') onCloseMenu()
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen, onCloseMenu])

  return (
    <div className={`session-chip type-${session.type}${selected ? ' session-chip-selected' : ''}`} draggable onDragStart={onDragStart} ref={rootRef}>
      <button type="button" className="session-chip-main" onClick={onOpenSession}>
        <span className="type-badge-letter">{t.letter}</span>
        <span className="session-chip-name">{session.name}</span>
        {session.startTime && <span className="session-chip-time">{formatTime(session.startTime)}</span>}
      </button>
      <button
        type="button"
        className="btn-ghost session-chip-menu-btn"
        aria-label={`Move ${session.name}`}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        onClick={() => (menuOpen ? onCloseMenu() : onOpenMenu())}
      >
        ⋮
      </button>
      {menuOpen && (
        <div className="row-menu session-chip-menu" role="menu">
          <label className="sr-only" htmlFor={`move-day-${session.id}`}>
            Day
          </label>
          <select
            id={`move-day-${session.id}`}
            value={session.day ?? ''}
            onChange={(e) => {
              const v = e.target.value
              if (v === '') onSchedule({ day: null, slot: null })
              else onSchedule({ day: Number(v), slot: session.slot ?? 0 })
            }}
          >
            <option value="">Unscheduled</option>
            {DAY_NAMES.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor={`move-slot-${session.id}`}>
            Slot
          </label>
          <select
            id={`move-slot-${session.id}`}
            value={session.slot ?? ''}
            disabled={session.day == null}
            onChange={(e) => onSchedule({ day: session.day ?? 0, slot: Number(e.target.value) })}
          >
            {daySlots.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
          <button type="button" className="row-menu-item" onClick={() => onSchedule({ day: null, slot: null })}>
            Move to Unscheduled
          </button>
        </div>
      )}
    </div>
  )
}

// `onSwitchToOutline()` switches to Outline without changing the selection
// — used by the quick-view panel's "Open full editor" (selectedPath is
// already pointing at the right session).
export default function PlanOverview({ onSwitchToOutline }) {
  const { state, dispatch } = useStore()
  const { plan, selectedPath } = state
  const daySlots = plan.daySlots
  const weekRows = useMemo(() => flattenWeeks(plan), [plan])
  const blocks = useMemo(() => groupByBlock(weekRows), [weekRows])
  const segments = useMemo(() => phaseSegments(weekRows), [weekRows])
  const today = todayISO()
  const currentIdx = useMemo(() => currentBlockIndex(blocks, plan.startDate, today), [blocks, plan.startDate, today])
  // Per-viewer only: which blocks are collapsed. Unset means "default for
  // its position" (only the current block starts open), not "closed".
  const [collapsedOverrides, setCollapsedOverrides] = useState({})
  const [openMenuFor, setOpenMenuFor] = useState(null)
  const dragCtx = useRef(null)

  // The quick-view panel's target: whichever session selectedPath names, if
  // it still exists (panel-open state is itself just selectedPath, which is
  // already per-viewer and never synced — see CLAUDE.md's "State" section).
  const panelRow = selectedPath?.sessionId ? weekRows.find((r) => r.week.id === selectedPath.weekId) : null
  const panelSession = panelRow?.week.sessions.find((s) => s.id === selectedPath.sessionId) || null

  function isCollapsed(blockId, index) {
    if (blockId in collapsedOverrides) return collapsedOverrides[blockId]
    return index !== currentIdx
  }
  function toggleBlock(blockId, index) {
    setCollapsedOverrides((c) => ({ ...c, [blockId]: !isCollapsed(blockId, index) }))
  }
  function jumpToWeek(weekId) {
    document.getElementById(`overview-week-${weekId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  function openSession(ids, weekId, session) {
    setOpenMenuFor(null)
    dispatch({ type: 'SELECT', path: { ...ids, weekId, sessionId: session.id } })
    jumpToWeek(weekId)
  }
  function closePanel() {
    dispatch({ type: 'SELECT', path: null })
  }
  function scheduleSession(ids, weekId, sessionId, fields) {
    dispatch({ type: 'SESSION_SCHEDULE_UPDATE', path: { ...ids, weekId, sessionId }, ...fields })
    setOpenMenuFor(null)
  }
  function addSession(ids, weekId, day, slot) {
    dispatch({ type: 'SESSION_ADD', ...ids, weekId, day, slot })
    jumpToWeek(weekId)
  }

  // Weeks belonging to a currently-open block light up in the season strip —
  // "Outlined = weeks shown below" in the mockup.
  const openWeekIds = new Set()
  blocks.forEach((b, i) => {
    if (!isCollapsed(b.block.id, i)) b.weeks.forEach((w) => openWeekIds.add(w.week.id))
  })

  const loads = weekRows.map((row) => weekLoad(row.week))
  const maxLoad = Math.max(1, ...loads.map((l) => l.total))

  if (weekRows.length === 0) {
    return (
      <div className="detail-empty">
        <div>No weeks yet.</div>
        <div style={{ fontSize: 12 }}>Switch to Outline and use &ldquo;+ Add phase&rdquo; to start the plan.</div>
      </div>
    )
  }

  return (
    <div className={`plan-overview-layout${panelSession ? ' has-panel' : ''}`}>
    <div className="plan-overview">
      <div className="panel panel-pad season-strip">
        <div className="season-strip-head">
          <span className="subtle-label" style={{ marginBottom: 0 }}>
            Season · {weekRows.length} week{weekRows.length === 1 ? '' : 's'} · Planned load
          </span>
          <div className="plan-start-control">
            <label htmlFor="plan-start-date">Plan start</label>
            <input
              id="plan-start-date"
              type="date"
              value={plan.startDate || ''}
              onChange={(e) => e.target.value && dispatch({ type: 'PLAN_START_DATE_UPDATE', date: e.target.value })}
            />
          </div>
          <span className="ex-desc">Click a week to jump. Outlined = weeks shown below.</span>
        </div>
        <div className="season-strip-bars">
          {weekRows.map((row, i) => {
            const load = loads[i]
            const fillPct = load.state === 'flat' ? 100 : Math.max(4, Math.round((load.total / maxLoad) * 100))
            return (
              <button
                key={row.week.id}
                type="button"
                className={`season-bar${openWeekIds.has(row.week.id) ? ' season-bar-open' : ''}${load.state === 'incomplete' ? ' season-bar-incomplete' : ''}`}
                onClick={() => jumpToWeek(row.week.id)}
                title={`Week ${i + 1} · ${row.block.name}${load.state === 'incomplete' ? ' · Load incomplete (not every session has a planned RPE and duration)' : ''}`}
                aria-label={`Jump to week ${i + 1}${load.state === 'incomplete' ? ' (load incomplete)' : ''}`}
              >
                <span className="season-bar-fill" style={{ height: `${fillPct}%` }} />
              </button>
            )
          })}
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

      <div className="grid-scroll-area">
      <div className="week-grid-head">
        <span />
        {DAY_ABBR.map((d) => (
          <span key={d} className="week-grid-head-day">
            {d.toUpperCase()}
          </span>
        ))}
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
                {blockIndex === currentIdx && (
                  <span className="chip" style={{ cursor: 'default' }}>
                    Current
                  </span>
                )}
                <span className="block-grid-context">
                  {weekRange} · {b.phase.name} › {b.sub.name}
                </span>
                <span className="block-grid-meta">
                  {!open && `${b.weeks.length} week${b.weeks.length === 1 ? '' : 's'} · ${sessionCount} session${sessionCount === 1 ? '' : 's'}`}
                </span>
              </button>

              {open && (
                <div className="block-grid-rows">
                  {b.weeks.map((w) => {
                    const ids = { phaseId: b.phase.id, subId: b.sub.id, blockId: b.block.id }
                    const unscheduled = w.week.sessions.filter((s) => s.day == null || s.slot == null)
                    return (
                      <div
                        className={`week-grid-row${selectedPath?.weekId === w.week.id && !selectedPath.sessionId ? ' selected' : ''}`}
                        id={`overview-week-${w.week.id}`}
                        key={w.week.id}
                      >
                        <div className="week-grid-label">
                          <div className="block-grid-week-name">{weekName(b.block, w.week)}</div>
                          {w.week.focus && <div className="ex-desc">{w.week.focus}</div>}
                        </div>

                        {Array.from({ length: 7 }).map((_, day) => (
                          <div className="week-grid-day" key={day}>
                            {daySlots.map((_, slot) => {
                              const cellSessions = w.week.sessions.filter((s) => s.day === day && s.slot === slot)
                              return (
                                <div
                                  className={`week-grid-cell${cellSessions.length > 0 ? ' week-grid-cell-filled' : ''}`}
                                  key={slot}
                                  onDragOver={(e) => {
                                    if (dragCtx.current?.weekId === w.week.id) e.preventDefault()
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault()
                                    if (dragCtx.current?.weekId !== w.week.id) return
                                    scheduleSession(ids, w.week.id, dragCtx.current.sessionId, { day, slot })
                                    dragCtx.current = null
                                  }}
                                >
                                  {cellSessions.map((session) => (
                                    <SessionChip
                                      key={session.id}
                                      session={session}
                                      daySlots={daySlots}
                                      selected={selectedPath?.sessionId === session.id}
                                      menuOpen={openMenuFor === session.id}
                                      onOpenMenu={() => setOpenMenuFor(session.id)}
                                      onCloseMenu={() => setOpenMenuFor(null)}
                                      onOpenSession={() => openSession(ids, w.week.id, session)}
                                      onSchedule={(fields) => scheduleSession(ids, w.week.id, session.id, fields)}
                                      onDragStart={() => {
                                        dragCtx.current = { weekId: w.week.id, sessionId: session.id }
                                      }}
                                    />
                                  ))}
                                  {cellSessions.length === 0 && (
                                    <button
                                      type="button"
                                      className="week-grid-add"
                                      aria-label={`Add session: ${DAY_NAMES[day]} ${daySlots[slot]}, ${weekName(b.block, w.week)}`}
                                      onClick={() => addSession(ids, w.week.id, day, slot)}
                                    >
                                      +
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}

                        {unscheduled.length > 0 && (
                          <div
                            className="week-grid-unscheduled"
                            onDragOver={(e) => {
                              if (dragCtx.current?.weekId === w.week.id) e.preventDefault()
                            }}
                            onDrop={(e) => {
                              e.preventDefault()
                              if (dragCtx.current?.weekId !== w.week.id) return
                              scheduleSession(ids, w.week.id, dragCtx.current.sessionId, { day: null, slot: null })
                              dragCtx.current = null
                            }}
                          >
                            <span className="subtle-label" style={{ marginBottom: 0 }}>
                              Unscheduled
                            </span>
                            <div className="week-grid-unscheduled-chips">
                              {unscheduled.map((session) => (
                                <SessionChip
                                  key={session.id}
                                  session={session}
                                  daySlots={daySlots}
                                  selected={selectedPath?.sessionId === session.id}
                                  menuOpen={openMenuFor === session.id}
                                  onOpenMenu={() => setOpenMenuFor(session.id)}
                                  onCloseMenu={() => setOpenMenuFor(null)}
                                  onOpenSession={() => openSession(ids, w.week.id, session)}
                                  onSchedule={(fields) => scheduleSession(ids, w.week.id, session.id, fields)}
                                  onDragStart={() => {
                                    dragCtx.current = { weekId: w.week.id, sessionId: session.id }
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      </div>

      <div className="block-grid-legend">
        {SESSION_TYPES.map((t) => (
          <span className="legend-item" key={t.id}>
            <span className={`legend-swatch ${t.dot}`} />
            {t.label}
          </span>
        ))}
      </div>
    </div>

    {panelSession && (
      <QuickViewPanel
        path={selectedPath}
        session={panelSession}
        weekLabel={weekName(panelRow.block, panelRow.week)}
        blockName={panelRow.block.name}
        onClose={closePanel}
        onOpenFullEditor={onSwitchToOutline}
      />
    )}
    </div>
  )
}
