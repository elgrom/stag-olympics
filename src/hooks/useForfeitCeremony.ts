import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export type CeremonyPhase = 'idle' | 'stag_spin' | 'stag_spinning' | 'stag_result' | 'loser_choice' | 'loser_spinning' | 'loser_forfeit' | 'loser_penalty' | 'done'

export interface CeremonyState {
  id: string
  phase: CeremonyPhase
  winner_name: string | null
  loser_name: string | null
  stag_forfeit: string | null
  loser_forfeit: string | null
  loser_penalty: string | null
  updated_at: string
}

const IDLE: Omit<CeremonyState, 'id' | 'updated_at'> = {
  phase: 'idle',
  winner_name: null,
  loser_name: null,
  stag_forfeit: null,
  loser_forfeit: null,
  loser_penalty: null,
}

export function useForfeitCeremony() {
  const [state, setState] = useState<CeremonyState | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const fetchState = useCallback(async () => {
    const { data } = await supabase
      .from('ceremony_state')
      .select('*')
      .limit(1)
      .single()
    if (data) setState(data as CeremonyState)
  }, [])

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchState()

    const channel = supabase
      .channel('ceremony-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ceremony_state' },
        (payload) => {
          setState(payload.new as CeremonyState)
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchState])

  // Poll every 1.5s when ceremony is active (fallback for unreliable realtime)
  useEffect(() => {
    const isActive = state && state.phase !== 'idle'
    if (isActive) {
      pollingRef.current = setInterval(fetchState, 1500)
    } else if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = undefined
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [state?.phase, fetchState])

  /** Update ceremony state in the database */
  const updateCeremony = useCallback(async (fields: Partial<Omit<CeremonyState, 'id' | 'updated_at'>>) => {
    if (!state) return
    const update = { ...fields, updated_at: new Date().toISOString() }
    await supabase
      .from('ceremony_state')
      .update(update)
      .eq('id', state.id)
    // Optimistic local update
    setState(prev => prev ? { ...prev, ...update } : prev)
  }, [state])

  /** Start a new ceremony */
  const startCeremony = useCallback(async (winnerName: string, loserName: string) => {
    await updateCeremony({
      phase: 'idle',
      winner_name: winnerName,
      loser_name: loserName,
      stag_forfeit: null,
      loser_forfeit: null,
      loser_penalty: null,
    })
  }, [updateCeremony])

  /** Reset ceremony to idle */
  const resetCeremony = useCallback(async () => {
    await updateCeremony(IDLE)
  }, [updateCeremony])

  const isActive = state !== null && state.phase !== 'idle'

  return { state, isActive, updateCeremony, startCeremony, resetCeremony, refetch: fetchState }
}
