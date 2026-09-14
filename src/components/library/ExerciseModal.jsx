import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { MOVEMENT_PATTERNS, EQUIPMENT, BODY_AREAS } from '../../lib/taxonomy'

const BLANK = {
  name: '',
  description: '',
  videoUrl: '',
  movementPattern: MOVEMENT_PATTERNS[0],
  equipment: EQUIPMENT[0],
  bodyAreas: [],
  tags: [],
}

export default function ExerciseModal({ editingId, onClose }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const isNew = editingId === 'new'
  const existing = isNew ? null : state.exercises.find((e) => e.id === editingId)

  const [form, setForm] = useState(existing ? { ...existing } : { ...BLANK })
  const [tagDraft, setTagDraft] = useState('')

  if (!isNew && !existing) return null

  function toggleBodyArea(area) {
    setForm((f) => ({
      ...f,
      bodyAreas: f.bodyAreas.includes(area) ? f.bodyAreas.filter((a) => a !== area) : [...f.bodyAreas, area],
    }))
  }

  function addTag() {
    const v = tagDraft.trim().replace(/^#/, '')
    if (v && !form.tags.includes(v)) setForm((f) => ({ ...f, tags: [...f.tags, v] }))
    setTagDraft('')
  }

  function removeTag(t) {
    setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))
  }

  function save() {
    const name = form.name.trim()
    if (!name) {
      toast('Name is required')
      return
    }
    const payload = { ...form, name, description: form.description.trim(), videoUrl: form.videoUrl.trim() }
    if (isNew) {
      dispatch({ type: 'EXERCISE_ADD', payload })
      toast('Exercise added')
    } else {
      dispatch({ type: 'EXERCISE_UPDATE', id: editingId, payload })
      toast('Exercise updated')
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>{isNew ? 'New exercise' : 'Edit exercise'}</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="field">
          <label>Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Description / coaching cues</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field">
          <label>YouTube link (optional)</label>
          <input
            type="url"
            placeholder="https://…"
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Movement pattern</label>
            <select value={form.movementPattern} onChange={(e) => setForm({ ...form, movementPattern: e.target.value })}>
              {MOVEMENT_PATTERNS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Equipment</label>
            <select value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })}>
              {EQUIPMENT.map((eq) => (
                <option key={eq}>{eq}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Body area(s)</label>
          <div>
            {BODY_AREAS.map((b) => (
              <label key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '2px 8px 2px 0', fontWeight: 400, color: 'var(--ink)' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={form.bodyAreas.includes(b)} onChange={() => toggleBodyArea(b)} />
                {b}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Tags (yours to organize with)</label>
          <div>
            {form.tags.map((t) => (
              <span className="chip chip-removable" key={t}>
                #{t}{' '}
                <button onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Type a tag and press Enter"
            style={{ marginTop: 6 }}
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagDraft.trim()) {
                e.preventDefault()
                addTag()
              }
            }}
          />
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save exercise
          </button>
        </div>
      </div>
    </div>
  )
}
