import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeTable<T extends { id: string }>(
  table: string,
  orderBy?: { column: string; ascending?: boolean },
): { rows: T[]; refetch: () => void } {
  const [rows, setRows] = useState<T[]>([])

  const fetchData = useCallback(() => {
    const query = supabase.from(table).select('*')
    if (orderBy) {
      query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }
    query.then(({ data }) => {
      if (data) setRows(data as T[])
    })
  }, [table, orderBy?.column, orderBy?.ascending])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRows(prev => [...prev, payload.new as T])
          } else if (payload.eventType === 'UPDATE') {
            setRows(prev => prev.map(row => row.id === (payload.new as T).id ? payload.new as T : row))
          } else if (payload.eventType === 'DELETE') {
            setRows(prev => prev.filter(row => row.id !== (payload.old as T).id))
          }
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, orderBy?.column, orderBy?.ascending])

  return { rows, refetch: fetchData }
}
