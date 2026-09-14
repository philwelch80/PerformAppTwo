import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { reducer } from './reducer'
import { freshState } from '../lib/seed'
import { supabase } from '../lib/supabaseClient'

const ROW_ID = 'singleton'
const SAVE_DEBOUNCE_MS = 600
const POLL_INTERVAL_MS = 8000

// Only these fields are shared across everyone with the link — selectedPath
// and expanded are per-viewer UI state and never leave the browser.
function sharedSlice(state) {
  return {
    exercises: state.exercises,
    plan: state.plan,
    savedSessions: state.savedSessions,
    sessionBlocks: state.sessionBlocks,
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, freshState)
  const [ready, setReady] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const lastSyncedAt = useRef(null)
  const saveTimer = useRef(null)
  const savingRef = useRef(false)
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
        dispatch({ type: 'HYDRATE', payload: data.state })
        lastSyncedAt.current = data.updated_at
      } else {
        const seed = freshState()
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
    if (!ready) return
    if (!skippedInitialSave.current) {
      skippedInitialSave.current = true
      return
    }
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
      if (error) setSyncError(error.message)
      else {
        lastSyncedAt.current = data.updated_at
        setSyncError(null)
      }
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(saveTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.exercises, state.plan, state.savedSessions, state.sessionBlocks, ready])

  // Light polling so other coaches' edits show up without a manual refresh.
  useEffect(() => {
    if (!ready) return
    const interval = setInterval(async () => {
      if (savingRef.current) return
      const { data, error } = await supabase.from('plan_builder_state').select('updated_at').eq('id', ROW_ID).maybeSingle()
      if (error || !data) return
      if (lastSyncedAt.current && data.updated_at <= lastSyncedAt.current) return
      const { data: full, error: fullError } = await supabase.from('plan_builder_state').select('*').eq('id', ROW_ID).maybeSingle()
      if (fullError || !full) return
      lastSyncedAt.current = full.updated_at
      dispatch({ type: 'HYDRATE', payload: full.state })
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [ready])

  const value = useMemo(() => ({ state, dispatch, ready, syncError }), [state, ready, syncError])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}

export async function resetSharedData() {
  const seed = freshState()
  await supabase
    .from('plan_builder_state')
    .update({ state: sharedSlice(seed), updated_at: new Date().toISOString() })
    .eq('id', ROW_ID)
  window.location.reload()
}
