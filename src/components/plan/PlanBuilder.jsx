import { useState } from 'react'
import { useStore } from '../../state/StoreContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { allWeeksWithPath } from '../../lib/planTree'
import PlanTree from './PlanTree.jsx'
import PlanDetail from './PlanDetail.jsx'
import PlanOverview from './PlanOverview.jsx'

export default function PlanBuilder() {
  const { state, dispatch } = useStore()
  const toast = useToast()
  // Per-viewer only — same as selectedPath/expanded, this never syncs.
  const [view, setView] = useState('outline')

  const weekRows = allWeeksWithPath(state.plan)
  const lastWeek = weekRows[weekRows.length - 1]

  function addWeekAtEnd() {
    if (!lastWeek) return
    dispatch({ type: 'WEEK_ADD', phaseId: lastWeek.path.phaseId, subId: lastWeek.path.subId, blockId: lastWeek.path.blockId })
    toast('Week added — plan extended without touching earlier weeks')
  }

  return (
    <div>
      <div className="plan-builder-head">
        <div className="plan-builder-head-title">
          <div className="subtle-label" style={{ marginBottom: 2 }}>
            Plan
          </div>
          <input
            type="text"
            className="plan-title-input"
            value={state.plan.name}
            onChange={(e) => dispatch({ type: 'PLAN_RENAME', name: e.target.value })}
          />
        </div>
        <div className="plan-builder-head-actions">
          <div className="seg-control plan-view-toggle" role="tablist" aria-label="Plan view">
            <button type="button" className="seg-btn" role="tab" aria-pressed={view === 'outline'} onClick={() => setView('outline')}>
              Outline
            </button>
            <button type="button" className="seg-btn" role="tab" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
              Grid
            </button>
          </div>
          {view === 'grid' && lastWeek && (
            <button type="button" className="btn btn-primary" onClick={addWeekAtEnd}>
              + Add week at end
            </button>
          )}
        </div>
      </div>

      {view === 'outline' ? (
        <div className="plan-layout">
          <PlanTree />
          <PlanDetail />
        </div>
      ) : (
        <PlanOverview onSwitchToOutline={() => setView('outline')} />
      )}
    </div>
  )
}
