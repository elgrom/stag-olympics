import type { ForfeitCeremonyState } from '../hooks/useForfeitCeremony'

interface Props {
  state: ForfeitCeremonyState
}

export function ForfeitCeremonyOverlay({ state }: Props) {
  if (!state.active) return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-6">🎡 Forfeit Ceremony</h2>
        <p className="text-sm text-gray-400 mb-8">
          {state.winnerName} won — {state.loserName} lost
        </p>

        {/* Spinning for Diccon */}
        {state.phase === 'stag_spinning' && (
          <div className="animate-pulse">
            <p className="text-lg text-yellow-400 mb-2">Spinning for Diccon...</p>
            <p className="text-6xl">🎰</p>
          </div>
        )}

        {/* Diccon's result */}
        {state.phase === 'stag_result' && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Diccon must do:</p>
            <p className="text-2xl font-bold text-yellow-400 mb-4">{state.stagForfeit}</p>
            <p className="text-4xl">😱</p>
            <p className="text-xs text-gray-500 mt-4">Waiting for losing team...</p>
          </div>
        )}

        {/* Spinning for losing team */}
        {state.phase === 'loser_spinning' && (
          <div>
            {state.stagForfeit && (
              <p className="text-xs text-gray-500 mb-6">Diccon: {state.stagForfeit} ✓</p>
            )}
            <div className="animate-pulse">
              <p className="text-lg text-red-400 mb-2">Spinning for {state.loserName}...</p>
              <p className="text-6xl">🎰</p>
            </div>
          </div>
        )}

        {/* Loser's forfeit result */}
        {state.phase === 'loser_forfeit' && (
          <div>
            {state.stagForfeit && (
              <p className="text-xs text-gray-500 mb-6">Diccon: {state.stagForfeit} ✓</p>
            )}
            <p className="text-sm text-gray-400 mb-2">{state.loserName} must do:</p>
            <p className="text-2xl font-bold text-red-400 mb-4">{state.loserForfeit}</p>
            <p className="text-4xl">🔥</p>
          </div>
        )}

        {/* Loser chose penalty */}
        {state.phase === 'loser_penalty' && (
          <div>
            {state.stagForfeit && (
              <p className="text-xs text-gray-500 mb-6">Diccon: {state.stagForfeit} ✓</p>
            )}
            <p className="text-sm text-gray-400 mb-2">{state.loserName} takes the penalty:</p>
            <p className="text-2xl font-bold text-orange-400 mb-4">⚠️ {state.loserPenalty}</p>
            <p className="text-xs text-gray-500 mt-2">...into the next round</p>
          </div>
        )}

        {/* Done */}
        {state.phase === 'done' && (
          <div>
            <p className="text-4xl mb-4">✅</p>
            <p className="text-lg text-green-400">Ceremony complete!</p>
            {state.stagForfeit && (
              <p className="text-xs text-gray-500 mt-4">Diccon: {state.stagForfeit}</p>
            )}
            {state.loserForfeit && (
              <p className="text-xs text-gray-500">{state.loserName}: {state.loserForfeit}</p>
            )}
            {state.loserPenalty && (
              <p className="text-xs text-gray-500">{state.loserName}: ⚠️ {state.loserPenalty}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
