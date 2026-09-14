import { useState } from 'react'
import { useStore } from '../../../state/StoreContext.jsx'
import { useToast } from '../../../state/ToastContext.jsx'
import ExercisePicker from './ExercisePicker.jsx'
import SessionBlockPicker from './SessionBlockPicker.jsx'

function exerciseName(exercises, id) {
  return exercises.find((e) => e.id === id)?.name || '(deleted exercise)'
}

export default function StrengthEditor({ path, session }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [pickerForGroup, setPickerForGroup] = useState(null)
  const [blockPickerOpen, setBlockPickerOpen] = useState(false)
  const groups = session.data.groups

  function saveGroupAsBlock(groupId, currentLabel) {
    const name = window.prompt('Name this session block', currentLabel || 'Warm-Up')
    if (!name || !name.trim()) return
    dispatch({ type: 'GROUP_SAVE_AS_BLOCK', path, groupId, name: name.trim() })
    toast('Saved as a reusable session block')
  }

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
              <button className="btn btn-ghost btn-sm" onClick={() => saveGroupAsBlock(group.id, group.label)} disabled={group.items.length === 0}>
                Save as session block
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
              {group.items.map((item, index) => (
                <div className="ex-row" key={index}>
                  <span className="ex-row-name">{exerciseName(state.exercises, item.exerciseId)}</span>
                  <input
                    type="number"
                    min="0"
                    value={item.sets}
                    onChange={(e) => dispatch({ type: 'GROUP_ITEM_UPDATE', path, groupId: group.id, itemIndex: index, field: 'sets', value: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    min="0"
                    value={item.reps}
                    onChange={(e) => dispatch({ type: 'GROUP_ITEM_UPDATE', path, groupId: group.id, itemIndex: index, field: 'reps', value: Number(e.target.value) })}
                  />
                  <input
                    type="text"
                    placeholder="optional"
                    value={item.startingWeight}
                    onChange={(e) => dispatch({ type: 'GROUP_ITEM_UPDATE', path, groupId: group.id, itemIndex: index, field: 'startingWeight', value: e.target.value })}
                  />
                  <button
                    className="btn btn-ghost btn-sm btn-danger-text"
                    onClick={() => dispatch({ type: 'GROUP_ITEM_DELETE', path, groupId: group.id, itemIndex: index })}
                  >
                    ×
                  </button>
                </div>
              ))}
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
        <div style={{ position: 'relative' }}>
          <button className="btn btn-sm" onClick={() => setBlockPickerOpen((v) => !v)}>
            Insert saved session block
          </button>
          {blockPickerOpen && (
            <SessionBlockPicker
              onSelect={(sessionBlockId) => {
                dispatch({ type: 'SESSION_BLOCK_INSERT', path, sessionBlockId })
                toast('Session block inserted as a new group')
              }}
              onClose={() => setBlockPickerOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
