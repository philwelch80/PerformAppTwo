import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { useConfirm } from '../../state/ConfirmContext.jsx'
import { MOVEMENT_PATTERNS, EQUIPMENT, BODY_AREAS } from '../../lib/taxonomy'
import { allTagNames, exerciseUsage } from '../../lib/exercises'
import TagPicker from './TagPicker.jsx'
import ExerciseUsageDialog from './ExerciseUsageDialog.jsx'

const BLANK = {
  name: '',
  description: '',
  videoUrl: '',
  movementPattern: MOVEMENT_PATTERNS[0],
  equipment: EQUIPMENT[0],
  bodyAreas: [],
  tags: [],
  archived: false,
}

export default function ExerciseModal({ editingId, onClose }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const confirm = useConfirm()
  const isNew = editingId === 'new'
  const existing = isNew ? null : state.exercises.find((e) => e.id === editingId)

  const [form, setForm] = useState(existing ? { ...existing } : { ...BLANK })
  const [showUsageDialog, setShowUsageDialog] = useState(false)

  if (!isNew && !existing) return null

  const allTags = allTagNames(state)

  function toggleBodyArea(area) {
    setForm((f) => ({
      ...f,
      bodyAreas: f.bodyAreas.includes(area) ? f.bodyAreas.filter((a) => a !== area) : [...f.bodyAreas, area],
    }))
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

  async function deleteOrArchive() {
    const usage = exerciseUsage(state, editingId)
    if (usage.total === 0) {
      const ok = await confirm({ title: `Delete "${existing.name}"?`, description: 'This cannot be undone.' })
      if (ok) {
        dispatch({ type: 'EXERCISE_DELETE', id: editingId })
        toast('Exercise deleted')
        onClose()
      }
      return
    }
    setShowUsageDialog(true)
  }

  function archive() {
    dispatch({ type: 'EXERCISE_ARCHIVE', id: editingId })
    toast('Exercise archived')
    setShowUsageDialog(false)
    onClose()
  }

  return (
    <>
      <div className="panel panel-pad edit-panel">
        <div className="modal-head">
          <h3>{isNew ? 'New exercise' : 'Edit exercise'}</h3>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
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
              <label key={b} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '2px 8px 2px 0', fontWeight: 400, color: 'var(--text)' }}>
                <input type="checkbox" style={{ width: 'auto' }} checked={form.bodyAreas.includes(b)} onChange={() => toggleBodyArea(b)} />
                {b}
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label style={{ marginBottom: 0 }}>Tags</label>
            <span className="ex-desc">Tap to add or remove</span>
          </div>
          <TagPicker allTags={allTags} selected={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
        </div>

        <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
          {!isNew ? (
            <button className="btn btn-danger-text" onClick={deleteOrArchive}>
              Delete or archive…
            </button>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              Save exercise
            </button>
          </div>
        </div>
      </div>

      {showUsageDialog && (
        <ExerciseUsageDialog
          exerciseName={existing.name}
          usage={exerciseUsage(state, editingId)}
          onArchive={archive}
          onCancel={() => setShowUsageDialog(false)}
        />
      )}
    </>
  )
}
