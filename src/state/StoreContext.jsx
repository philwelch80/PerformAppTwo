import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { reducer } from './reducer'
import { freshState } from '../lib/seed'
import { supabase } from '../lib/supabaseClient'
import { CURRENT_VERSION, isNewerThanSupported, migrate } from '../lib/migrate'

export const ROW_ID = import.meta.env.VITE_STATE_ROW_ID || 'singleton'
const SAVE_DEBOUNCE_MS = 600
const POLL_INTERVAL_MS = 8000

// Only these fields are shared across everyone with the link — selectedPath
// and expanded are per-viewer UI state and never leave the browser.
function sharedSlice(state) {
  return {
    exercises: state.exercises,
    plan: state.plan,
    savedSessions: state.savedSessions,
    exerciseGroups: state.exerciseGroups,
    schemaVersion: CURRENT_VERSION,
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => migrate(freshState()))
  const [ready, setReady] = useState(false)
  const [syncError, setSyncError] = useState(null)
  // A row saved by a newer client than this one understands — we stop
  // saving over it and tell the coach to reload.
  const [tooNew, setTooNew] = useState(false)
  const lastSyncedAt = useRef(null)
  const saveTimer = useRef(null)
  const savingRef = useRef(false)
  // True from the moment a local edit schedules a save until that save
  // actually lands — a poll must never hydrate over an edit still in flight.
  const pendingSaveRef = useRef(false)
  const skippedInitialSave = useRef(false)

  // Initial load: adopt whatever's already shared, or seed the row if this
  // is the very first visitor.
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase.from('plan_builder_state').select('*').eq('id', ROW_ID).maybeSingle()
      if (cancelled) return
      if (error) {
        setSyncError(error.message)
        setReady(true)
        return
      }
      if (data) {
        if (isNewerThanSupported(data.state)) {
          setTooNew(true)
          setReady(true)
          return
        }
        dispatch({ type: 'HYDRATE', payload: migrate(data.state) })
        lastSyncedAt.current = data.updated_at
      } else {
        const seed = migrate(freshState())
        const { data: inserted, error: insertError } = await supabase
          .from('plan_builder_state')
          .insert({ id: ROW_ID, state: sharedSlice(seed) })
          .select()
          .single()
        if (!cancelled && !insertError) lastSyncedAt.current = inserted.updated_at
        if (!cancelled && insertError) setSyncError(insertError.message)
      }
      if (!cancelled) setReady(true)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Debounced save whenever the shared slice changes (skips the render
  // right after hydration, which isn't a local edit).
  useEffect(() => {
    if (!ready || tooNew) return
    if (!skippedInitialSave.current) {
      skippedInitialSave.current = true
      return
    }
    pendingSaveRef.current = true
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      savingRef.current = true
      const { data, error } = await supabase
        .from('plan_builder_state')
        .update({ state: sharedSlice(state), updated_at: new Date().toISOString() })
        .eq('id', ROW_ID)
        .select()
        .single()
      savingRef.current = false
      pendingSaveRef.current = false
      if (error) setSyncError(error.message)
      else {
        lastSyncedAt.current = data.updated_at
        setSyncError(null)
      }
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.exercises, state.plan, state.savedSessions, state.exerciseGroups, ready, tooNew])

  // Light polling so other coaches' edits show up without a manual refresh.
  useEffect(() => {
    if (!ready) return
    const interval = setInterval(async () => {
      if (savingRef.current || pendingSaveRef.current) return
      const { data, error } = await supabase.from('plan_builder_state').select('updated_at').eq('id', ROW_ID).maybeSingle()
      if (error || !data) return
      if (lastSyncedAt.current && data.updated_at <= lastSyncedAt.current) return
      const { data: full, error: fullError } = await supabase.from('plan_builder_state').select('*').eq('id', ROW_ID).maybeSingle()
      if (fullError || !full) return
      if (isNewerThanSupported(full.state)) {
        setTooNew(true)
        return
      }
      lastSyncedAt.current = full.updated_at
      dispatch({ type: 'HYDRATE', payload: migrate(full.state) })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [ready])

  const value = useMemo(() => ({ state, dispatch, ready, syncError, tooNew }), [state, ready, syncError, tooNew])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}

export async function resetSharedData() {
  const seed = migrate(freshState())
  await supabase
    .from('plan_builder_state')
    .update({ state: sharedSlice(seed), updated_at: new Date().toISOString() })
    .eq('id', ROW_ID)
  window.location.reload()
}
