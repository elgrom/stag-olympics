import { useState } from 'react'
import type { CeremonyState, CeremonyPhase } from '../hooks/useForfeitCeremony'
import type { Forfeit } from '../lib/types'

interface Props {
  state: CeremonyState | null
  forfeits: Forfeit[]
  onMarkUsed: (id: string) => void
  onUpdateCeremony: (fields: { phase?: CeremonyPhase; stag_forfeit?: string; loser_forfeit?: string; loser_penalty?: string }) => void
  nextPenalty?: string
}

export function ForfeitCeremonyOverlay({ state, forfeits, onMarkUsed, onUpdateCeremony, nextPenalty }: Props) {
  const [spinning, setSpinning] = useState(false)

  if (!state || state.phase === 'idle') return null

  const spinAndReveal = (target: 'stag' | 'loser') => {
    const available = forfeits.filter(f => !f.is_used)
    if (available.length === 0) {
      // No forfeits left — show a message instead of getting stuck
      if (target === 'stag') {
        onUpdateCeremony({ phase: 'stag_result', stag_forfeit: 'No forfeits left! Make one up!' })
      } else {
        onUpdateCeremony({ phase: 'loser_forfeit', loser_forfeit: 'No forfeits left! Make one up!' })
      }
      return
    }

    setSpinning(true)
    onUpdateCeremony({ phase: target === 'stag' ? 'stag_spinning' : 'loser_spinning' })

    setTimeout(() => {
      const chosen = available[Math.floor(Math.random() * available.length)]
      onMarkUsed(chosen.id)

      if (target === 'stag') {
        onUpdateCeremony({ phase: 'stag_result', stag_forfeit: chosen.text })
      } else {
        onUpdateCeremony({ phase: 'loser_forfeit', loser_forfeit: chosen.text })
      }
      setSpinning(false)
    }, 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-4">🎡 Forfeit Ceremony</h2>
        <p className="text-sm text-gray-400 mb-8">
          {state.winner_name} won — {state.loser_name} lost
        </p>

        {/* Waiting for someone to spin for Diccon */}
        {state.phase === 'stag_spin' && (
          <div>
            <p className="text-lg text-gray-300 mb-4">Spin for Diccon!</p>
            <button onClick={() => spinAndReveal('stag')} disabled={spinning}
              className="w-full py-6 bg-yellow-600 hover:bg-yellow-500 active:scale-95 rounded-xl font-bold text-2xl transition-all disabled:opacity-50">
              🎰 SPIN!
            </button>
          </div>
        )}

        {/* Spinning animation for Diccon */}
        {state.phase === 'stag_spinning' && (
          <div className="animate-pulse">
            <p className="text-lg text-yellow-400 mb-2">Spinning for Diccon...</p>
            <p className="text-6xl animate-bounce">🎰</p>
          </div>
        )}

        {/* Diccon's result */}
        {state.phase === 'stag_result' && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Diccon must do:</p>
            <p className="text-2xl font-bold text-yellow-400 mb-4">{state.stag_forfeit}</p>
            <p className="text-4xl">😱</p>
            <p className="text-xs text-gray-500 mt-6">Waiting for admin...</p>
          </div>
        )}

        {/* Loser's choice — spin or penalty */}
        {state.phase === 'loser_choice' && (
          <div>
            {state.stag_forfeit && (
              <p className="text-xs text-gray-500 mb-6">Diccon: {state.stag_forfeit} ✓</p>
            )}
            <p className="text-lg text-gray-300 mb-4">{state.loser_name} — forfeit or penalty?</p>
            <button onClick={() => spinAndReveal('loser')} disabled={spinning}
              className="w-full py-6 bg-red-600 hover:bg-red-500 active:scale-95 rounded-xl font-bold text-2xl transition-all mb-3 disabled:opacity-50">
              🎰 SPIN A FORFEIT!
            </button>
            {nextPenalty && (
              <div className="mt-4 bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Or take the penalty into next round:</p>
                <p className="text-lg font-bold text-orange-400">⚠️ {nextPenalty}</p>
                <p className="text-xs text-gray-600 mt-1">Admin assigns this from their screen</p>
              </div>
            )}
          </div>
        )}

        {/* Spinning for losing team */}
        {state.phase === 'loser_spinning' && (
          <div>
            {state.stag_forfeit && (
              <p className="text-xs text-gray-500 mb-6">Diccon: {state.stag_forfeit} ✓</p>
            )}
            <div className="animate-pulse">
              <p className="text-lg text-red-400 mb-2">Spinning for {state.loser_name}...</p>
              <p className="text-6xl animate-bounce">🎰</p>
            </div>
          </div>
        )}

        {/* Loser's forfeit result */}
        {state.phase === 'loser_forfeit' && (
          <div>
            {state.stag_forfeit && (
              <p className="text-xs text-gray-500 mb-6">Diccon: {state.stag_forfeit} ✓</p>
            )}
            <p className="text-sm text-gray-400 mb-2">{state.loser_name} must do:</p>
            <p className="text-2xl font-bold text-red-400 mb-4">{state.loser_forfeit}</p>
            <p className="text-4xl">🔥</p>
            {nextPenalty && (
              <div className="mt-6 bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Or take the penalty instead:</p>
                <p className="text-lg font-bold text-orange-400">⚠️ {nextPenalty}</p>
              </div>
            )}
          </div>
        )}

        {/* Loser chose penalty */}
        {state.phase === 'loser_penalty' && (
          <div>
            {state.stag_forfeit && (
              <p className="text-xs text-gray-500 mb-6">Diccon: {state.stag_forfeit} ✓</p>
            )}
            <p className="text-sm text-gray-400 mb-2">{state.loser_name} takes the penalty:</p>
            <p className="text-2xl font-bold text-orange-400 mb-4">⚠️ {state.loser_penalty}</p>
            <p className="text-xs text-gray-500 mt-2">...into the next round</p>
          </div>
        )}

        {/* Done */}
        {state.phase === 'done' && (
          <div>
            <p className="text-4xl mb-4">✅</p>
            <p className="text-lg text-green-400">Ceremony complete!</p>
            {state.stag_forfeit && (
              <p className="text-xs text-gray-500 mt-4">Diccon: {state.stag_forfeit}</p>
            )}
            {state.loser_forfeit && (
              <p className="text-xs text-gray-500">{state.loser_name}: {state.loser_forfeit}</p>
            )}
            {state.loser_penalty && (
              <p className="text-xs text-gray-500">{state.loser_name}: ⚠️ {state.loser_penalty}</p>
            )}
          </div>
        )}

        {/* Close button on result/done phases */}
        {['loser_forfeit', 'loser_penalty', 'done'].includes(state.phase) && (
          <button onClick={() => onUpdateCeremony({ phase: 'idle' })}
            className="mt-8 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-400">
            Close
          </button>
        )}
      </div>
    </div>
  )
}
