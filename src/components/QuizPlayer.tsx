import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { QUIZ_QUESTIONS } from '../lib/quiz-data'
import { useQuizChannel } from '../hooks/useQuizChannel'
import { displayName } from '../lib/types'
import type { Player } from '../lib/types'

interface Props {
  players: Player[]
}

export function QuizPlayer({ players }: Props) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(30)
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set())
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const { currentQuestion, revealed, finished } = useQuizChannel()

  // Load already-claimed names from quiz_responses on mount
  useEffect(() => {
    supabase.from('quiz_responses').select('player_id').then(({ data }) => {
      if (data) {
        setClaimedIds(new Set(data.map(r => r.player_id)))
      }
    })
  }, [])

  // Listen for name claims from other players via broadcast
  useEffect(() => {
    const channel = supabase.channel('quiz-claims')
      .on('broadcast', { event: 'claim' }, ({ payload }) => {
        setClaimedIds(prev => new Set([...prev, payload.playerId]))
      })
      .on('broadcast', { event: 'reset_claims' }, () => {
        setClaimedIds(new Set())
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Broadcast when claiming a name
  const claimPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId)
    setClaimedIds(prev => new Set([...prev, playerId]))
    supabase.channel('quiz-claims').send({
      type: 'broadcast',
      event: 'claim',
      payload: { playerId },
    })
  }

  // Reset local state when quiz is reset
  useEffect(() => {
    if (currentQuestion === null && Object.keys(answers).length > 0) {
      setAnswers({})
      setSelectedPlayerId(null)
      setClaimedIds(new Set())
    }
  }, [currentQuestion])

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

  const [pendingAnswer, setPendingAnswer] = useState<string | null>(null)
  const pendingRef = useRef<string | null>(null)

  // Keep ref in sync so the save effect can read it
  useEffect(() => { pendingRef.current = pendingAnswer }, [pendingAnswer])

  // Reset pending answer when a new question appears
  useEffect(() => { setPendingAnswer(null) }, [currentQuestion])

  // Save answer when timer hits 0 or answer is revealed
  useEffect(() => {
    if (!revealed && timeLeft > 0) return
    if (!selectedPlayerId || currentQuestion === null) return
    if (answers[currentQuestion]) return // already saved

    const answer = pendingRef.current
    if (!answer) return

    const question = QUIZ_QUESTIONS.find(q => q.number === currentQuestion)
    if (!question) return

    const isCorrect = answer === question.correctAnswer
    setAnswers(prev => ({ ...prev, [currentQuestion]: answer }))

    supabase.from('quiz_responses').insert({
      player_id: selectedPlayerId,
      question_number: currentQuestion,
      answer,
      is_correct: isCorrect,
    })
  }, [revealed, timeLeft])

  const [nicknameStep, setNicknameStep] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')

  const confirmJoin = async () => {
    if (!selectedPlayerId) return
    if (nicknameInput.trim()) {
      await supabase.from('players').update({ nickname: nicknameInput.trim() }).eq('id', selectedPlayerId)
    }
    setNicknameStep(false)
  }

  // Player selection screen
  if (!selectedPlayerId || nicknameStep) {
    // Step 1: pick name
    if (!selectedPlayerId) {
      return (
        <div className="px-4 pt-6 pb-24">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">🧠 How Well Do You Know Diccon?</h1>
            <p className="text-sm text-gray-400 mt-2">Select your name to join the quiz</p>
          </div>
          <div className="space-y-2">
            {players
              .sort((a, b) => a.first_name.localeCompare(b.first_name))
              .map(player => {
                const taken = claimedIds.has(player.id)
                return (
                  <button key={player.id}
                    onClick={() => {
                      if (!taken) {
                        claimPlayer(player.id)
                        setNicknameInput(player.nickname || '')
                        setNicknameStep(true)
                      }
                    }}
                    disabled={taken}
                    className={`w-full py-3 rounded-lg text-sm font-medium ${
                      taken
                        ? 'bg-gray-900/50 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}>
                    {displayName(player)} {player.last_name}
                    {player.nickname && <span className="ml-1 text-gray-500">({player.nickname})</span>}
                    {taken && <span className="ml-2 text-xs text-gray-500">✓ joined</span>}
                  </button>
                )
              })}
          </div>
        </div>
      )
    }

    // Step 2: nickname
    const pickedPlayer = players.find(p => p.id === selectedPlayerId)
    return (
      <div className="px-4 pt-6 pb-24 text-center">
        <h1 className="text-2xl font-bold mb-2">🧠 How Well Do You Know Diccon?</h1>
        <p className="text-gray-400 mb-6">Hi {pickedPlayer && displayName(pickedPlayer)}! Want a nickname for the leaderboard?</p>
        <input
          type="text"
          value={nicknameInput}
          onChange={e => setNicknameInput(e.target.value)}
          placeholder={pickedPlayer?.first_name}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-center text-sm mb-4"
        />
        <button onClick={confirmJoin}
          className="w-full py-3 bg-green-700 hover:bg-green-600 rounded-lg font-bold text-sm">
          {nicknameInput.trim() ? `Join as "${nicknameInput.trim()}"` : 'Join without nickname'}
        </button>
      </div>
    )
  }

  const selectedPlayer = players.find(p => p.id === selectedPlayerId)

  // Finished screen
  if (finished) {
    const correctCount = Object.entries(answers).filter(([qNum, ans]) => {
      const q = QUIZ_QUESTIONS.find(q => q.number === parseInt(qNum))
      return q && ans === q.correctAnswer
    }).length

    return (
      <div className="px-4 pt-6 pb-24 text-center">
        <h1 className="text-2xl font-bold mb-2">🧠 Quiz Complete!</h1>
        <p className="text-gray-400 mb-6">{selectedPlayer && displayName(selectedPlayer)}, you scored:</p>
        <div className="text-6xl font-bold text-yellow-400 mb-2">{correctCount}/10</div>
        <p className="text-gray-500 text-sm">Check the leaderboard for the full results</p>
      </div>
    )
  }

  // Waiting screen
  if (currentQuestion === null) {
    return (
      <div className="px-4 pt-6 pb-24 text-center">
        <h1 className="text-2xl font-bold mb-4">🧠 How Well Do You Know Diccon?</h1>
        <p className="text-gray-400 mb-2">Hi {selectedPlayer && displayName(selectedPlayer)}!</p>
        <div className="animate-pulse text-gray-500 text-sm">Waiting for the quizmaster...</div>
      </div>
    )
  }

  // Question screen
  const question = QUIZ_QUESTIONS.find(q => q.number === currentQuestion)
  if (!question) return null

  const savedAnswer = answers[currentQuestion]
  const myAnswer = savedAnswer ?? pendingAnswer
  const timedOut = timeLeft === 0 && !myAnswer
  const locked = !!savedAnswer || timedOut || revealed

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-gray-500">Q{question.number} of 10</span>
        {!revealed && (
          <span className={`text-sm font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-yellow-400'}`}>
            {timeLeft}s
          </span>
        )}
      </div>

      {/* Timer bar */}
      {!revealed && (
        <div className="h-1 bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              timeLeft <= 5 ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>
      )}

      {/* Question */}
      <h2 className="text-lg font-bold mb-6">{question.text}</h2>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map(option => {
          let className = 'w-full py-4 px-4 rounded-lg text-left text-sm font-medium transition-all '

          if (revealed) {
            if (option.label === question.correctAnswer) {
              className += 'bg-green-700 text-white'
            } else if (option.label === myAnswer) {
              className += 'bg-red-700 text-white'
            } else {
              className += 'bg-gray-900 text-gray-500'
            }
          } else if (option.label === pendingAnswer) {
            className += 'bg-blue-700 text-white'
          } else if (locked) {
            className += 'bg-gray-900 text-gray-600'
          } else {
            className += 'bg-gray-900 hover:bg-gray-800 text-white'
          }

          return (
            <button
              key={option.label}
              onClick={() => !locked && setPendingAnswer(option.label)}
              disabled={locked}
              className={className}
            >
              <span className="font-bold mr-3">{option.label}</span>
              {option.value}
            </button>
          )
        })}
      </div>

      {/* Feedback */}
      {revealed && myAnswer && (
        <p className={`text-center mt-4 font-bold ${
          myAnswer === question.correctAnswer ? 'text-green-400' : 'text-red-400'
        }`}>
          {myAnswer === question.correctAnswer ? '✅ Correct!' : '❌ Wrong!'}
        </p>
      )}
      {revealed && timedOut && (
        <p className="text-center mt-4 font-bold text-gray-500">⏰ Time's up!</p>
      )}
    </div>
  )
}
