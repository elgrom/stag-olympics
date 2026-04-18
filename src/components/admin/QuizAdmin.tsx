import { useState, useEffect, useRef } from 'react'
import { QUIZ_QUESTIONS } from '../../lib/quiz-data'
import { useQuizChannel } from '../../hooks/useQuizChannel'
import { useRealtimeTable } from '../../hooks/useRealtimeTable'
import { supabase } from '../../lib/supabase'
import type { Player } from '../../lib/types'

interface QuizResponse {
  id: string
  player_id: string
  question_number: number
  answer: string
  is_correct: boolean
  created_at: string
}

interface Props {
  players: Player[]
  onQuizComplete: (results: { playerId: string; score: number }[]) => void
}

export function QuizAdmin({ players, onQuizComplete }: Props) {
  const { currentQuestion, revealed, finished, broadcast } = useQuizChannel()
  const { rows: responses, refetch: refetchResponses } = useRealtimeTable<QuizResponse>('quiz_responses')
  const [timeLeft, setTimeLeft] = useState(30)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  // Start/reset timer when a new question is shown
  useEffect(() => {
    if (currentQuestion === null || revealed) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    setTimeLeft(30)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [currentQuestion, revealed])

  const showQuestion = (num: number) => {
    broadcast({ type: 'show_question', question: num })
  }

  const revealAnswer = () => {
    if (currentQuestion !== null) {
      broadcast({ type: 'reveal', question: currentQuestion })
    }
  }

  const nextQuestion = () => {
    if (currentQuestion !== null && currentQuestion < 10) {
      showQuestion(currentQuestion + 1)
    }
  }

  const resetQuiz = async () => {
    if (!confirm('Reset quiz? This wipes all responses.')) return
    await supabase.from('quiz_responses').delete().gte('created_at', '1970-01-01')
    await supabase.from('individual_scores').delete().gte('created_at', '1970-01-01')
    broadcast({ type: 'reset' })
    refetchResponses()
  }

  const finishQuiz = () => {
    broadcast({ type: 'finished' })

    // Calculate scores per player
    const scores: Record<string, number> = {}
    for (const r of responses) {
      if (r.is_correct) {
        scores[r.player_id] = (scores[r.player_id] ?? 0) + 1
      }
    }

    const results = players
      .map(p => ({ playerId: p.id, score: scores[p.id] ?? 0 }))
      .filter(r => responses.some(resp => resp.player_id === r.playerId))
      .sort((a, b) => b.score - a.score)

    onQuizComplete(results)
  }

  // Count responses for current question
  const currentResponses = currentQuestion !== null
    ? responses.filter(r => r.question_number === currentQuestion)
    : []

  // Overall standings
  const standings = players
    .map(p => {
      const correct = responses.filter(r => r.player_id === p.id && r.is_correct).length
      const total = responses.filter(r => r.player_id === p.id).length
      return { player: p, correct, total }
    })
    .filter(s => s.total > 0)
    .sort((a, b) => b.correct - a.correct)

  const currentQ = currentQuestion !== null
    ? QUIZ_QUESTIONS.find(q => q.number === currentQuestion)
    : null

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-sm mb-3">🧠 Quiz Master Controls</h3>

      {/* Not started yet */}
      {currentQuestion === null && !finished && (
        <>
          <p className="text-xs text-gray-500 mb-3">
            {responses.length === 0
              ? 'Players are joining... hit Start when ready.'
              : `${new Set(responses.map(r => r.player_id)).size} players have joined.`
            }
          </p>
          <button onClick={() => showQuestion(1)}
            className="w-full py-3 bg-green-700 hover:bg-green-600 rounded text-sm font-bold">
            Start Quiz — Show Question 1
          </button>
        </>
      )}

      {/* Active question */}
      {currentQ && !finished && (
        <>
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-yellow-400">Question {currentQ.number} of 10</p>
              {!revealed && (
                <span className={`text-lg font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-yellow-400'}`}>
                  {timeLeft}s
                </span>
              )}
            </div>
            {!revealed && (
              <div className="h-1 bg-gray-800 rounded-full mb-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    timeLeft <= 5 ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
              </div>
            )}
            <p className="text-sm font-medium">{currentQ.text}</p>
            <p className="text-xs text-green-400 mt-1">
              Answer: {currentQ.correctAnswer}) {currentQ.options.find(o => o.label === currentQ.correctAnswer)?.value}
            </p>
          </div>

          <p className="text-xs text-gray-500 mb-3">
            {currentResponses.length} / {players.length} answered
          </p>

          <div className="flex gap-2">
            {!revealed ? (
              <button onClick={revealAnswer}
                className="flex-1 py-2 bg-yellow-700 hover:bg-yellow-600 rounded text-sm font-medium">
                Reveal Answer
              </button>
            ) : currentQuestion < 10 ? (
              <button onClick={nextQuestion}
                className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm font-medium">
                Next Question →
              </button>
            ) : (
              <button onClick={finishQuiz}
                className="flex-1 py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-medium">
                Finish Quiz — Show Results
              </button>
            )}
          </div>
        </>
      )}

      {/* Finished */}
      {finished && (
        <div>
          <p className="text-xs text-green-400 mb-2">Quiz complete! Top 2 are your captains.</p>
          <p className="text-xs text-gray-500 mb-3">Scores have been saved as individual points. Proceed to the draft below.</p>
        </div>
      )}

      {/* Reset */}
      <button onClick={resetQuiz}
        className="w-full py-2 mt-3 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-400">
        🔄 Reset Quiz & Wipe Responses
      </button>

      {/* Live standings */}
      {standings.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Standings</p>
          {standings.map((s, i) => (
            <div key={s.player.id}
              className={`flex justify-between py-1 text-xs ${
                i < 2 && finished ? 'text-yellow-400 font-bold' : 'text-gray-300'
              }`}>
              <span>
                {i < 2 && finished ? '👑 ' : `${i + 1}. `}
                {s.player.first_name} {s.player.last_name}
              </span>
              <span>{s.correct}/{s.total}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
