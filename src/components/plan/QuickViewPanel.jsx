import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { useConfirm } from '../../state/ConfirmContext.jsx'
import { usePrompt } from '../../state/PromptContext.jsx'
import { sessionTypeInfo } from '../../lib/taxonomy'
import ScheduleFields from './ScheduleFields.jsx'
import SetsInput from '../common/SetsInput.jsx'

function findExercise(exercises, id) {
  return exercises.find((e) => e.id === id) || null
}

// The rotation line for a superset: set 1 of each exercise in turn, then
// set 2 of each, and so on (domain definition in CLAUDE.md) — stated with
// full exercise names rather than the mockup's hand-picked abbreviations,
// since there's no reliable rule to shorten an arbitrary exercise name.
function rotationLine(group, exercises) {
  const names = group.items.map((item) => findExercise(exercises, item.exerciseId)?.name || '(deleted exercise)')
  const maxSets = Math.max(0, ...group.items.map((item) => item.sets || 0))
  const steps = []
  for (let round = 1; round <= maxSets; round++) {
    group.items.forEach((item, i) => {
      if (item.sets >= round) steps.push(`${names[i]} ${round}`)
    })
  }
  return steps.join(' → ')
}

function StrengthQuickBody({ path, session, exercises, dispatch }) {
  const groups = session.data.groups
  if (groups.length === 0) return <div className="empty-state">No groups yet — use &ldquo;Open full editor&rdquo; to add one.</div>
  return (
    <>
      {groups.map((group) => (
        <div className={`qvp-group${group.isSuperset ? ' qvp-group-superset' : ''}`} key={group.id}>
          <div className="qvp-group-head">
            <span className="qvp-group-label">{group.label || (group.isSuperset ? 'Superset' : 'Straight set')}</span>
            <span className="qvp-group-type">{group.isSuperset ? 'Alternate one set at a time' : 'Straight sets'}</span>
          </div>
          {group.items.map((item, index) => {
            const ex = findExercise(exercises, item.exerciseId)
            return (
              <div className="ex-row" key={index}>
                <span className="ex-row-name">{ex ? ex.name : '(deleted exercise)'}</span>
                <SetsInput
                  value={item.sets}
                  onCommit={(sets) => dispatch({ type: 'GROUP_ITEM_UPDATE', path, groupId: group.id, itemIndex: index, field: 'sets', value: sets })}
                />
                <input
                  type="text"
                  aria-label="Reps"
                  value={item.reps}
                  onChange={(e) => dispatch({ type: 'GROUP_ITEM_UPDATE', path, groupId: group.id, itemIndex: index, field: 'reps', value: e.target.value })}
                />
                <input
                  type="text"
                  aria-label="Starting weight"
                  placeholder="optional"
                  value={item.startingWeight}
                  onChange={(e) => dispatch({ type: 'GROUP_ITEM_UPDATE', path, groupId: group.id, itemIndex: index, field: 'startingWeight', value: e.target.value })}
                />
              </div>
            )
          })}
          {group.isSuperset && group.items.length > 0 && <div className="qvp-rotation">{rotationLine(group, exercises)}</div>}
        </div>
      ))}
      <div className="ex-desc" style={{ marginTop: 4 }}>
        Sets · reps · starting weight. Adding exercises, reordering and supersets are in the full editor.
      </div>
    </>
  )
}

// Conditioning/routines have no quick-editable structure of their own (no
// groups/exercises to adjust sets or reps on) — shown read-only here rather
// than inventing new fields; "Open full editor" is where they're edited.
function ConditioningQuickBody({ session }) {
  const d = session.data
  return (
    <dl className="qvp-readonly">
      <dt>Modality</dt>
      <dd>{d.modality}</dd>
      {d.pacing && (
        <>
          <dt>Interval / pacing</dt>
          <dd>{d.pacing}</dd>
        </>
      )}
      {d.description && (
        <>
          <dt>Description</dt>
          <dd>{d.description}</dd>
        </>
      )}
      {d.targetValue && (
        <>
          <dt>Target</dt>
          <dd>{d.targetValue}</dd>
        </>
      )}
    </dl>
  )
}

function RoutinesQuickBody({ session }) {
  const items = session.data.items
  if (items.length === 0) return <div className="empty-state">No items yet — use &ldquo;Open full editor&rdquo; to add the flow.</div>
  return (
    <ol className="qvp-readonly-list">
      {items.map((item, i) => (
        <li key={i}>
          <span className="qvp-group-label">{item.label || '(untitled step)'}</span>
          {item.note && <span className="ex-desc"> — {item.note}</span>}
        </li>
      ))}
    </ol>
  )
}

export default function QuickViewPanel({ path, session, weekLabel, blockName, onClose, onOpenFullEditor }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()
  const [deleting, setDeleting] = useState(false)
  const t = sessionTypeInfo(session.type)

  function duplicate() {
    dispatch({ type: 'SESSION_DUPLICATE', phaseId: path.phaseId, subId: path.subId, blockId: path.blockId, weekId: path.weekId, sessionId: path.sessionId })
    toast('Session duplicated')
  }

  async function saveAsTemplate() {
    const name = await prompt({ title: 'Name this saved session template', label: 'Name', defaultValue: session.name })
    if (!name) return
    dispatch({ type: 'SESSION_SAVE_AS_TEMPLATE', path, name })
    toast('Saved as a reusable session template')
  }

  async function handleDelete() {
    setDeleting(true)
    const ok = await confirm({ title: `Delete "${session.name}"?` })
    setDeleting(false)
    if (!ok) return
    dispatch({ type: 'NODE_DELETE', kind: 'session', parts: [path.phaseId, path.subId, path.blockId, path.weekId, path.sessionId] })
    onClose()
  }

  return (
    <>
      <div className="quick-view-backdrop" onClick={onClose} />
      <div className="quick-view-panel panel" role="region" aria-label="Session quick view">
        <div className="qvp-head">
          <span className={`type-badge ${t.badge}`}>
            <span className="type-badge-letter">{t.letter}</span>
            {t.label.toUpperCase()}
          </span>
          <button type="button" className="btn-ghost qvp-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        <input
          type="text"
          className="plan-title-input qvp-title-input"
          value={session.name}
          onChange={(e) => dispatch({ type: 'SESSION_RENAME', path, name: e.target.value })}
          aria-label="Session name"
        />
        <div className="ex-desc" style={{ marginBottom: 12 }}>
          {weekLabel} · {blockName}
        </div>

        <ScheduleFields path={path} session={session} idPrefix="qvp-sched" />

        <hr className="divider" />

        {session.type === 'strength' && <StrengthQuickBody path={path} session={session} exercises={state.exercises} dispatch={dispatch} />}
        {session.type === 'conditioning' && <ConditioningQuickBody session={session} />}
        {session.type === 'routines' && <RoutinesQuickBody session={session} />}

        <div className="qvp-actions">
          <button type="button" className="btn btn-primary" onClick={onOpenFullEditor} style={{ width: '100%' }}>
            Open full editor
          </button>
          <div className="qvp-actions-row">
            <button type="button" className="btn btn-sm" onClick={duplicate}>
              Duplicate
            </button>
            <button type="button" className="btn btn-sm" onClick={saveAsTemplate}>
              Save as template
            </button>
            <button type="button" className="btn btn-sm btn-danger" disabled={deleting} onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
