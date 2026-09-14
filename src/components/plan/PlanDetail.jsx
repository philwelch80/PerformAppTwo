import { useStore } from '../../state/StoreContext.jsx'
import { locatePath } from '../../lib/planTree'
import PhaseDetail from './PhaseDetail.jsx'
import SubDetail from './SubDetail.jsx'
import BlockDetail from './BlockDetail.jsx'
import WeekDetail from './WeekDetail.jsx'
import SessionBuilder from './SessionBuilder/SessionBuilder.jsx'

export default function PlanDetail() {
  const { state } = useStore()
  const { phase, sub, block, week, session } = locatePath(state.plan, state.selectedPath)

  return (
    <div className="panel detail-panel">
      {session ? (
        <SessionBuilder path={state.selectedPath} session={session} />
      ) : week ? (
        <WeekDetail path={state.selectedPath} week={week} />
      ) : block ? (
        <BlockDetail path={state.selectedPath} block={block} />
      ) : sub ? (
        <SubDetail path={state.selectedPath} sub={sub} />
      ) : phase ? (
        <PhaseDetail path={state.selectedPath} phase={phase} />
      ) : (
        <div className="detail-empty">
          <div>Select a phase, subphase, block, week, or session from the tree.</div>
          <div style={{ fontSize: 12 }}>Or use &ldquo;+ Add phase&rdquo; to extend this plan.</div>
        </div>
      )}
    </div>
  )
}
