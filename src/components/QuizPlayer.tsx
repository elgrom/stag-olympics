import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { QUIZ_QUESTIONS } from '../lib/quiz-data'
import { useQuizChannel } from '../hooks/useQuizChannel'
import type { Player } from '../lib/types'

interface Props {
  players: Player[]
}

export function QuizPlayer({ players }: Props) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [timeLeft, setTimeLeft] = useState(30)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const { currentQuestion, revealed, finished } = useQuizChannel()

  // Reset local state when quiz is reset (currentQuestion goes back to null while we have answers)
  useEffect(() => {
    if (currentQuestion === null && Object.keys(answers).length > 0) {
      setAnswers({})
      setSelectedPlayerId(null)
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

  const submitAnswer = async (questionNumber: number, answerLabel: string) => {
    if (!selectedPlayerId || answers[questionNumber]) return

    const question = QUIZ_QUESTIONS.find(q => q.number === questionNumber)
    if (!question) return

    const isCorrect = answerLabel === question.correctAnswer

    setAnswers(prev => ({ ...prev, [questionNumber]: answerLabel }))

    await supabase.from('quiz_responses').insert({
      player_id: selectedPlayerId,
      question_number: questionNumber,
      answer: answerLabel,
      is_correct: isCorrect,
    })
  }

  // Player selection screen
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
            .map(player => (
              <button key={player.id}
                onClick={() => setSelectedPlayerId(player.id)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium">
                {player.first_name} {player.last_name}
              </button>
            ))}
        </div>
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
        <p className="text-gray-400 mb-6">{selectedPlayer?.first_name}, you scored:</p>
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
        <p className="text-gray-400 mb-2">Hi {selectedPlayer?.first_name}!</p>
        <div className="animate-pulse text-gray-500 text-sm">Waiting for the quizmaster...</div>
      </div>
    )
  }

  // Question screen
  const question = QUIZ_QUESTIONS.find(q => q.number === currentQuestion)
  if (!question) return null

  const myAnswer = answers[currentQuestion]
  const timedOut = timeLeft === 0 && !myAnswer
  const locked = !!myAnswer || timedOut || revealed

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
          } else if (option.label === myAnswer) {
            className += 'bg-blue-700 text-white'
          } else if (locked) {
            className += 'bg-gray-900 text-gray-600'
          } else {
            className += 'bg-gray-900 hover:bg-gray-800 text-white'
          }

          return (
            <button
              key={option.label}
              onClick={() => !locked && submitAnswer(currentQuestion, option.label)}
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
