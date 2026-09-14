import { useStore } from '../../../state/StoreContext.jsx'
import { CONDITIONING_MODALITIES, CONDITIONING_TARGET_TYPES } from '../../../lib/taxonomy'

export default function ConditioningEditor({ path, session }) {
  const { dispatch } = useStore()
  const data = session.data

  function update(field, value) {
    dispatch({ type: 'CONDITIONING_UPDATE', path, field, value })
  }

  return (
    <div>
      <div className="field-row">
        <div className="field">
          <label>Modality</label>
          <select value={data.modality} onChange={(e) => update('modality', e.target.value)}>
            {CONDITIONING_MODALITIES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Interval / pacing</label>
          <input type="text" placeholder="e.g. 6x3min on / 90s off" value={data.pacing} onChange={(e) => update('pacing', e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Description</label>
        <textarea placeholder="What the session is, route/terrain notes, etc." value={data.description} onChange={(e) => update('description', e.target.value)} />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Target type</label>
          <select value={data.targetType} onChange={(e) => update('targetType', e.target.value)}>
            {CONDITIONING_TARGET_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Target value</label>
          <input
            type="text"
            placeholder={data.targetType === 'hr' ? 'e.g. 145-155 bpm' : 'e.g. 220-240W'}
            value={data.targetValue}
            onChange={(e) => update('targetValue', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
