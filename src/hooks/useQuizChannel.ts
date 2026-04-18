import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type QuizEvent =
  | { type: 'show_question'; question: number }
  | { type: 'reveal'; question: number }
  | { type: 'finished' }
  | { type: 'reset' }

export function useQuizChannel() {
  const [currentQuestion, setCurrentQuestion] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const channel = supabase.channel('quiz')
      .on('broadcast', { event: 'quiz_event' }, ({ payload }) => {
        const ev = payload as QuizEvent
        if (ev.type === 'show_question') {
          setCurrentQuestion(ev.question)
          setRevealed(false)
        } else if (ev.type === 'reveal') {
          setRevealed(true)
        } else if (ev.type === 'finished') {
          setFinished(true)
        } else if (ev.type === 'reset') {
          setCurrentQuestion(null)
          setRevealed(false)
          setFinished(false)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const broadcast = useCallback(async (event: QuizEvent) => {
    await supabase.channel('quiz').send({
      type: 'broadcast',
      event: 'quiz_event',
      payload: event,
    })
    // Also update local state for the admin
    if (event.type === 'show_question') {
      setCurrentQuestion(event.question)
      setRevealed(false)
    } else if (event.type === 'reveal') {
      setRevealed(true)
    } else if (event.type === 'finished') {
      setFinished(true)
    } else if (event.type === 'reset') {
      setCurrentQuestion(null)
      setRevealed(false)
      setFinished(false)
    }
  }, [])

  return { currentQuestion, revealed, finished, broadcast }
}
