import { useStore } from '../../state/StoreContext.jsx'
import { DAY_NAMES } from '../../lib/schedule'
import OptionalIntegerInput from '../common/OptionalIntegerInput.jsx'

// Day/slot/start-time + planned RPE/minutes, shared by the full session
// editor (Outline) and the Grid's quick-view panel — same dispatch, same
// store, so an edit in either place stays in sync with the other.
export default function ScheduleFields({ path, session, idPrefix }) {
  const { state, dispatch } = useStore()
  const daySlots = state.plan.daySlots

  function updateSchedule(fields) {
    dispatch({ type: 'SESSION_SCHEDULE_UPDATE', path, ...fields })
  }
  function updatePlanned(field, value) {
    dispatch({ type: 'SESSION_PLANNED_UPDATE', path, field, value })
  }

  return (
    <>
      <div className="field-row schedule-fields">
        <div className="field">
          <label htmlFor={`${idPrefix}-day`}>Day</label>
          <select
            id={`${idPrefix}-day`}
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
          <label htmlFor={`${idPrefix}-slot`}>Slot</label>
          <select
            id={`${idPrefix}-slot`}
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
          <label htmlFor={`${idPrefix}-time`}>Start time</label>
          <input
            id={`${idPrefix}-time`}
            type="time"
            value={session.startTime || ''}
            disabled={session.day == null}
            onChange={(e) => updateSchedule({ startTime: e.target.value || null })}
          />
        </div>
      </div>
      <div className="field-row schedule-fields">
        <div className="field">
          <label htmlFor={`${idPrefix}-rpe`}>Planned RPE</label>
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
          <label htmlFor={`${idPrefix}-minutes`}>Planned minutes</label>
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
    </>
  )
}
