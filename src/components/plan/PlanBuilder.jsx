import PlanTree from './PlanTree.jsx'
import PlanDetail from './PlanDetail.jsx'

export default function PlanBuilder() {
  return (
    <div className="plan-layout">
      <PlanTree />
      <PlanDetail />
    </div>
  )
}
