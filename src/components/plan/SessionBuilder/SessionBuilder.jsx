import { useStore } from '../../../state/StoreContext.jsx'
import { useToast } from '../../../state/ToastContext.jsx'
import { useConfirm } from '../../../state/ConfirmContext.jsx'
import { usePrompt } from '../../../state/PromptContext.jsx'
import { SESSION_TYPES } from '../../../lib/taxonomy'
import { DAY_NAMES } from '../../../lib/schedule'
import OptionalIntegerInput from '../../common/OptionalIntegerInput.jsx'
import StrengthEditor from './StrengthEditor.jsx'
import ConditioningEditor from './ConditioningEditor.jsx'
import MobilityEditor from './MobilityEditor.jsx'

function hasContent(session) {
  if (session.type === 'strength') return session.data.groups.some((g) => g.items.length > 0)
  if (session.type === 'conditioning') return !!(session.data.description || session.data.pacing || session.data.targetValue)
  return session.data.items.length > 0
}

export default function SessionBuilder({ path, session, onDelete, hideSaveAsTemplate }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()
  const daySlots = state.plan.daySlots

  function updateSchedule(fields) {
    dispatch({ type: 'SESSION_SCHEDULE_UPDATE', path, ...fields })
  }
  function updatePlanned(field, value) {
    dispatch({ type: 'SESSION_PLANNED_UPDATE', path, field, value })
  }

  async function setType(nextType) {
    if (nextType === session.type) return
    if (hasContent(session)) {
      const ok = await confirm({
        title: 'Switch session type?',
        description: 'This clears what you’ve entered for the current type.',
        confirmLabel: 'Switch',
        danger: false,
      })
      if (!ok) return
    }
    dispatch({ type: 'SESSION_SET_TYPE', path, sessionType: nextType })
  }

  async function saveAsTemplate() {
    const name = await prompt({ title: 'Name this saved session template', label: 'Name', defaultValue: session.name })
    if (!name) return
    dispatch({ type: 'SESSION_SAVE_AS_TEMPLATE', path, name })
    toast('Saved as a reusable session template')
  }

  return (
    <div>
      <div className="detail-head">
        <div style={{ flex: 1 }}>
          <div className="subtle-label">Session</div>
          <input
            type="text"
            className="plan-title-input"
            style={{ padding: '4px 0' }}
            value={session.name}
            onChange={(e) => dispatch({ type: 'SESSION_RENAME', path, name: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!hideSaveAsTemplate && (
            <button className="btn btn-sm" onClick={saveAsTemplate}>
              Save as session template
            </button>
          )}
          <button
            className="btn btn-danger-text btn-sm"
            onClick={async () => {
              const ok = await confirm({ title: `Delete "${session.name}"?` })
              if (!ok) return
              if (onDelete) {
                onDelete()
              } else {
                dispatch({
                  type: 'NODE_DELETE',
                  kind: 'session',
                  parts: [path.phaseId, path.subId, path.blockId, path.weekId, session.id],
                })
              }
            }}
          >
            Delete session
          </button>
        </div>
      </div>

      <div className="panel-pad">
        {!path.savedSessionId && (
          <>
            <div className="subtle-label">Schedule</div>
            <div className="field-row schedule-fields">
              <div className="field">
                <label htmlFor="sched-day">Day</label>
                <select
                  id="sched-day"
                  value={session.day ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') updateSchedule({ day: null, slot: null })
                    else updateSchedule({ day: Number(v), slot: session.slot ?? 0 })
                  }}
                >
                  <option value="">Unscheduled</option>
                  {DAY_NAMES.map((name, i) => (
                    <option key={name} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="sched-slot">Slot</label>
                <select
                  id="sched-slot"
                  value={session.slot ?? ''}
                  disabled={session.day == null}
                  onChange={(e) => updateSchedule({ day: session.day ?? 0, slot: Number(e.target.value) })}
                >
                  {daySlots.map((label, i) => (
                    <option key={label} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="sched-time">Start time</label>
                <input
                  id="sched-time"
                  type="time"
                  value={session.startTime || ''}
                  disabled={session.day == null}
                  onChange={(e) => updateSchedule({ startTime: e.target.value || null })}
                />
              </div>
            </div>
            <div className="field-row schedule-fields">
              <div className="field">
                <label htmlFor="sched-rpe">Planned RPE</label>
                <OptionalIntegerInput
                  ariaLabel="Planned RPE"
                  placeholder="1–10"
                  min={1}
                  max={10}
                  value={session.plannedRpe}
                  onCommit={(v) => updatePlanned('plannedRpe', v)}
                />
              </div>
              <div className="field">
                <label htmlFor="sched-minutes">Planned minutes</label>
                <OptionalIntegerInput
                  ariaLabel="Planned minutes"
                  placeholder="e.g. 60"
                  min={1}
                  max={999}
                  value={session.plannedMinutes}
                  onCommit={(v) => updatePlanned('plannedMinutes', v)}
                />
              </div>
            </div>
            <hr className="divider" />
          </>
        )}

        <div className="seg-control" role="tablist" aria-label="Session type">
          {SESSION_TYPES.map((t) => (
            <button key={t.id} className="seg-btn" role="tab" aria-pressed={session.type === t.id} onClick={() => setType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <hr className="divider" />

        {session.type === 'strength' && <StrengthEditor path={path} session={session} />}
        {session.type === 'conditioning' && <ConditioningEditor path={path} session={session} />}
        {session.type === 'routines' && <MobilityEditor path={path} session={session} />}
      </div>
    </div>
  )
}
