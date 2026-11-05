import { useState } from 'react'
import { useStore, resetSharedData, ROW_ID } from './state/StoreContext.jsx'
import Library from './components/library/Library.jsx'
import PlanBuilder from './components/plan/PlanBuilder.jsx'

const TABS = [
  { id: 'library', label: 'Library' },
  { id: 'plan', label: 'Plan builder' },
]

export default function App() {
  const { state, ready, syncError, tooNew } = useStore()
  const [activeTab, setActiveTab] = useState('library')
  const [resetting, setResetting] = useState(false)

  const counts = {
    library: state.exercises.filter((e) => !e.archived).length,
    plan: null,
  }

  const devBanner = ROW_ID !== 'singleton' && <div className="dev-banner">Dev data: {ROW_ID} — not the live plan</div>

  const header = (
    <header className="app-header">
      <div className="app-header-inner">
        <span className="app-header-brand">Block &amp; Barbell</span>
        <nav className="app-header-nav" role="tablist" aria-label="Main">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="app-header-tab"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {counts[t.id] != null && <span className="count">{counts[t.id]}</span>}
            </button>
          ))}
        </nav>
        <span className="app-header-badge">Prototype · shared plan</span>
      </div>
    </header>
  )

  if (!ready) {
    return (
      <>
        {header}
        {devBanner}
        <div className="shell">
          <div className="detail-empty">Loading the shared plan…</div>
        </div>
      </>
    )
  }

  if (tooNew) {
    return (
      <>
        {header}
        {devBanner}
        <div className="shell">
          <div className="empty-state" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            Someone saved a newer version of this plan than this tab understands. Reload to pick it up — this
            tab won&apos;t save over it until you do.
          </div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {header}
      {devBanner}
      <div className="shell">
        <div className="app-subbar">
          <div className="topbar-note">
            This tests the <b>data model and interactions</b> for the coach side only — not the final look.
            Click around, break it, then send feedback on what didn&apos;t hang together.
          </div>
          <button
            className="btn btn-ghost btn-sm"
            disabled={resetting}
            onClick={async () => {
              if (window.confirm('Reset the shared plan back to the example data? This clears what everyone has edited.')) {
                setResetting(true)
                await resetSharedData()
              }
            }}
          >
            {resetting ? 'Resetting…' : 'Reset demo data'}
          </button>
        </div>

        {syncError && (
          <div className="empty-state" style={{ marginBottom: 16, borderColor: 'var(--danger)', color: 'var(--danger)' }}>
            Couldn&apos;t sync with the shared backend ({syncError}). Your edits are only visible in this tab until it reconnects.
          </div>
        )}

        {activeTab === 'library' && <Library />}
        {activeTab === 'plan' && <PlanBuilder />}

        <div className="foot-note">
          Coach-side prototype only — no athlete views, no accounts. Anyone with this link sees and can
          edit the same shared plan (no login) — edits sync to everyone within a few seconds.
        </div>
      </div>
    </>
  )
}
