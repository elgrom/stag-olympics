import { useCallback } from 'react'
import { useRealtimeTable } from './useRealtimeTable'
import { supabase } from '../lib/supabase'
import type { Forfeit } from '../lib/types'

export function useForfeits() {
  const { rows: forfeits } = useRealtimeTable<Forfeit>('forfeits')

  const addForfeit = useCallback(async (text: string) => {
    await supabase.from('forfeits').insert({ text })
  }, [])

  const markUsed = useCallback(async (id: string) => {
    await supabase.from('forfeits').update({ is_used: true }).eq('id', id)
  }, [])

  return { forfeits, addForfeit, markUsed }
}
