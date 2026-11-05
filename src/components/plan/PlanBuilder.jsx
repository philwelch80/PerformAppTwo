import { useState } from 'react'
import PlanTree from './PlanTree.jsx'
import PlanDetail from './PlanDetail.jsx'
import PlanOverview from './PlanOverview.jsx'

export default function PlanBuilder() {
  // Per-viewer only — same as selectedPath/expanded, this never syncs.
  const [view, setView] = useState('outline')

  return (
    <div>
      <div className="seg-control plan-view-toggle" role="tablist" aria-label="Plan view">
        <button type="button" className="seg-btn" role="tab" aria-pressed={view === 'outline'} onClick={() => setView('outline')}>
          Outline
        </button>
        <button type="button" className="seg-btn" role="tab" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
          Grid
        </button>
      </div>

      {view === 'outline' ? (
        <div className="plan-layout">
          <PlanTree />
          <PlanDetail />
        </div>
      ) : (
        <PlanOverview />
      )}
    </div>
  )
}
