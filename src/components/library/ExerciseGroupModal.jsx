import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { allTagNames } from '../../lib/exercises'
import TagPicker from './TagPicker.jsx'
import ExercisePicker from '../plan/SessionBuilder/ExercisePicker.jsx'
import SetsInput from '../common/SetsInput.jsx'
import Modal from '../common/Modal.jsx'

export default function ExerciseGroupModal({ groupId, onClose }) {
  const { state, dispatch } = useStore()
  const [pickerOpen, setPickerOpen] = useState(false)
  const group = state.exerciseGroups.find((g) => g.id === groupId)
  if (!group) return null

  const allTags = allTagNames(state)

  function update(payload) {
    dispatch({ type: 'EXERCISE_GROUP_UPDATE', id: group.id, payload })
  }

  return (
    <Modal onClose={onClose} maxWidth={560} labelledBy="exercise-group-title">
      <div className="modal-head">
        <h3 id="exercise-group-title">Edit exercise group</h3>
        <button className="btn btn-ghost" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className="field">
        <label htmlFor="exercise-group-name">Name</label>
        <input id="exercise-group-name" type="text" value={group.name} onChange={(e) => update({ name: e.target.value })} />
      </div>

      <div className="field">
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 400, color: 'var(--text)' }}>
          <input
            type="checkbox"
            style={{ width: 'auto' }}
            checked={group.isSuperset}
            disabled={group.items.length < 2}
            onChange={(e) => update({ isSuperset: e.target.checked })}
          />
          Superset (exercises alternate one set at a time)
        </label>
      </div>

      <div className="field">
        <label>Tags</label>
        <TagPicker allTags={allTags} selected={group.tags} onChange={(tags) => update({ tags })} />
      </div>

      <div className="field">
        <label>Exercises</label>
        {group.items.length === 0 ? (
          <div className="empty-state">No exercises yet.</div>
        ) : (
          <>
            <div className="ex-row ex-row-head">
              <span>Exercise</span>
              <span>Sets</span>
              <span>Reps</span>
              <span>Starting wt.</span>
              <span></span>
            </div>
            {group.items.map((item, index) => {
              const ex = state.exercises.find((x) => x.id === item.exerciseId)
              return (
                <div className="ex-row" key={index}>
                  <span className="ex-row-name">
                    {ex ? ex.name : '(deleted exercise)'}
                    {ex?.archived && (
                      <span className="chip chip-archived" style={{ marginLeft: 6 }}>
                        archived
                      </span>
                    )}
                  </span>
                  <SetsInput
                    value={item.sets}
                    onCommit={(sets) => dispatch({ type: 'EXERCISE_GROUP_ITEM_UPDATE', id: group.id, itemIndex: index, field: 'sets', value: sets })}
                  />
                  <input
                    type="text"
                    aria-label="Reps"
                    placeholder="8, 8-10, AMRAP…"
                    value={item.reps}
                    onChange={(e) => dispatch({ type: 'EXERCISE_GROUP_ITEM_UPDATE', id: group.id, itemIndex: index, field: 'reps', value: e.target.value })}
                  />
                  <input
                    type="text"
                    aria-label="Starting weight"
                    placeholder="optional"
                    value={item.startingWeight}
                    onChange={(e) => dispatch({ type: 'EXERCISE_GROUP_ITEM_UPDATE', id: group.id, itemIndex: index, field: 'startingWeight', value: e.target.value })}
                  />
                  <button
                    className="btn btn-ghost btn-sm btn-danger-text"
                    aria-label={`Remove ${ex ? ex.name : 'exercise'}`}
                    onClick={() => dispatch({ type: 'EXERCISE_GROUP_ITEM_DELETE', id: group.id, itemIndex: index })}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </>
        )}
        <div style={{ position: 'relative', marginTop: 8 }}>
          <button className="btn btn-sm" onClick={() => setPickerOpen((v) => !v)}>
            + Add exercise
          </button>
          {pickerOpen && (
            <ExercisePicker
              onSelect={(exerciseId) => dispatch({ type: 'EXERCISE_GROUP_ITEM_ADD', id: group.id, exerciseId })}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  )
}
