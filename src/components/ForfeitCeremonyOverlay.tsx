import type { CeremonyState } from '../hooks/useForfeitCeremony'

interface Props {
  state: CeremonyState | null
}

export function ForfeitCeremonyOverlay({ state }: Props) {
  if (!state || state.phase === 'idle') return null

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-6">🎡 Forfeit Ceremony</h2>
        <p className="text-sm text-gray-400 mb-8">
          {state.winner_name} won — {state.loser_name} lost
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
            <p className="text-2xl font-bold text-yellow-400 mb-4">{state.stag_forfeit}</p>
            <p className="text-4xl">😱</p>
            <p className="text-xs text-gray-500 mt-4">Waiting for losing team...</p>
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
              <p className="text-6xl">🎰</p>
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
      </div>
    </div>
  )
}
