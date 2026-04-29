import { useCallback } from 'react'
import { useRealtimeTable } from './useRealtimeTable'
import { supabase } from '../lib/supabase'
import type { Forfeit } from '../lib/types'

export function useForfeits() {
  const { rows: forfeits, refetch } = useRealtimeTable<Forfeit>('forfeits')

  const addForfeit = useCallback(async (text: string) => {
    await supabase.from('forfeits').insert({ text })
  }, [])

  const markUsed = useCallback(async (id: string) => {
    await supabase.from('forfeits').update({ is_used: true }).eq('id', id)
  }, [])

  const clearAll = useCallback(async () => {
    await supabase.from('forfeits').delete().gte('created_at', '1970-01-01')
    refetch()
  }, [refetch])

  return { forfeits, addForfeit, markUsed, clearAll, refetch }
}
