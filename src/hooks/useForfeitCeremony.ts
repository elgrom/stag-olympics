import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type ForfeitEvent =
  | { type: 'start'; winnerName: string; loserName: string }
  | { type: 'stag_spinning' }
  | { type: 'stag_result'; forfeit: string }
  | { type: 'loser_spinning'; teamName: string }
  | { type: 'loser_forfeit'; teamName: string; forfeit: string }
  | { type: 'loser_penalty'; teamName: string; penalty: string }
  | { type: 'done' }
  | { type: 'reset' }

export interface ForfeitCeremonyState {
  active: boolean
  phase: 'idle' | 'stag_spinning' | 'stag_result' | 'loser_spinning' | 'loser_forfeit' | 'loser_penalty' | 'done'
  winnerName: string | null
  loserName: string | null
  stagForfeit: string | null
  loserForfeit: string | null
  loserPenalty: string | null
}

const INITIAL_STATE: ForfeitCeremonyState = {
  active: false,
  phase: 'idle',
  winnerName: null,
  loserName: null,
  stagForfeit: null,
  loserForfeit: null,
  loserPenalty: null,
}

export function useForfeitCeremony() {
  const [state, setState] = useState<ForfeitCeremonyState>(INITIAL_STATE)

  function applyEvent(ev: ForfeitEvent) {
    setState(prev => {
      switch (ev.type) {
        case 'start':
          return { ...INITIAL_STATE, active: true, phase: 'idle', winnerName: ev.winnerName, loserName: ev.loserName }
        case 'stag_spinning':
          return { ...prev, phase: 'stag_spinning' }
        case 'stag_result':
          return { ...prev, phase: 'stag_result', stagForfeit: ev.forfeit }
        case 'loser_spinning':
          return { ...prev, phase: 'loser_spinning' }
        case 'loser_forfeit':
          return { ...prev, phase: 'loser_forfeit', loserForfeit: ev.forfeit }
        case 'loser_penalty':
          return { ...prev, phase: 'loser_penalty', loserPenalty: ev.penalty }
        case 'done':
          return { ...prev, phase: 'done' }
        case 'reset':
          return INITIAL_STATE
        default:
          return prev
      }
    })
  }

  useEffect(() => {
    const channel = supabase.channel('forfeit-ceremony')
      .on('broadcast', { event: 'forfeit_event' }, ({ payload }) => {
        applyEvent(payload as ForfeitEvent)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const broadcast = useCallback(async (event: ForfeitEvent) => {
    await supabase.channel('forfeit-ceremony').send({
      type: 'broadcast',
      event: 'forfeit_event',
      payload: event,
    })
    // Also update local state (for admin)
    applyEvent(event)
  }, [])

  return { state, broadcast }
}
