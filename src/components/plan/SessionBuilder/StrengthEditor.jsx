import { useState } from 'react'
import { useStore } from '../../../state/StoreContext.jsx'
import { useToast } from '../../../state/ToastContext.jsx'
import ExercisePicker from './ExercisePicker.jsx'
import SaveGroupDialog from './SaveGroupDialog.jsx'
import InsertGroupDialog from './InsertGroupDialog.jsx'
import SetsInput from '../../common/SetsInput.jsx'

function findExercise(exercises, id) {
  return exercises.find((e) => e.id === id) || null
}

export default function StrengthEditor({ path, session }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [pickerForGroup, setPickerForGroup] = useState(null)
  const [savingGroupId, setSavingGroupId] = useState(null)
  const [insertGroupOpen, setInsertGroupOpen] = useState(false)
  const groups = session.data.groups
  const savingGroup = groups.find((g) => g.id === savingGroupId)

  return (
    <div>
      {groups.length === 0 && <div className="empty-state">No groups yet. Add one to start building this session.</div>}

      {groups.map((group) => (
        <div className="group-block" key={group.id}>
          <div className="group-head">
            <input
              type="text"
              placeholder={group.items.length > 1 ? 'Superset / circuit label' : 'Group label (optional)'}
              value={group.label}
              onChange={(e) => dispatch({ type: 'GROUP_RENAME', path, groupId: group.id, label: e.target.value })}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setSavingGroupId(group.id)} disabled={group.items.length < 2}>
                Save as exercise group
              </button>
              <button className="btn btn-ghost btn-sm btn-danger-text" onClick={() => dispatch({ type: 'GROUP_DELETE', path, groupId: group.id })}>
                Delete group
              </button>
            </div>
          </div>

          {group.items.length > 0 && (
            <>
              <div className="ex-row ex-row-head">
                <span>Exercise</span>
                <span>Sets</span>
                <span>Reps</span>
                <span>Starting wt.</span>
                <span></span>
              </div>
              {group.items.map((item, index) => {
                const ex = findExercise(state.exercises, item.exerciseId)
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
                    onCommit={(sets) => dispatch({ type: 'GROUP_ITEM_UPDATE', path, groupId: group.id, itemIndex: index, field: 'sets', value: sets })}
                  />
                  <input
                    type="text"
                    aria-label="Reps"
                    placeholder="8, 8-10, AMRAP…"
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
                  <button
                    className="btn btn-ghost btn-sm btn-danger-text"
                    aria-label={`Remove ${ex ? ex.name : 'exercise'}`}
                    onClick={() => dispatch({ type: 'GROUP_ITEM_DELETE', path, groupId: group.id, itemIndex: index })}
                  >
                    ×
                  </button>
                </div>
                )
              })}
            </>
          )}

          <div style={{ position: 'relative', marginTop: 8 }}>
            <button className="btn btn-sm" onClick={() => setPickerForGroup(pickerForGroup === group.id ? null : group.id)}>
              + Add exercise
            </button>
            {pickerForGroup === group.id && (
              <ExercisePicker
                onSelect={(exerciseId) => dispatch({ type: 'GROUP_ITEM_ADD', path, groupId: group.id, exerciseId })}
                onClose={() => setPickerForGroup(null)}
              />
            )}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={() => dispatch({ type: 'GROUP_ADD', path })}>
          + Add group
        </button>
        <button className="btn btn-sm" onClick={() => setInsertGroupOpen(true)}>
          Insert exercise group
        </button>
      </div>

      {savingGroup && (
        <SaveGroupDialog
          group={savingGroup}
          defaultName={savingGroup.label}
          onClose={() => setSavingGroupId(null)}
          onSave={(name, includeWeights) => {
            dispatch({ type: 'GROUP_SAVE_AS_GROUP', path, groupId: savingGroupId, name, includeWeights })
            toast('Saved as an exercise group')
            setSavingGroupId(null)
          }}
        />
      )}

      {insertGroupOpen && (
        <InsertGroupDialog
          session={session}
          onClose={() => setInsertGroupOpen(false)}
          onInsert={(exerciseGroupId, position) => {
            dispatch({ type: 'EXERCISE_GROUP_INSERT', path, exerciseGroupId, position })
            toast('Exercise group inserted')
            setInsertGroupOpen(false)
          }}
        />
      )}
    </div>
  )
}
