import { supabase } from '../../lib/supabase'
import type { Round } from '../../lib/types'

interface Props {
  rounds: Round[]
}

export function RoundControl({ rounds }: Props) {
  const currentLive = rounds.find(r => r.status === 'live')
  const nextUpcoming = rounds.filter(r => r.status === 'upcoming').sort((a, b) => a.number - b.number)[0]

  const startRound = async (round: Round) => {
    if (currentLive) {
      await supabase.from('rounds').update({ status: 'completed' }).eq('id', currentLive.id)
    }
    await supabase.from('rounds').update({ status: 'live' }).eq('id', round.id)
  }

  const endRound = async (round: Round) => {
    await supabase.from('rounds').update({ status: 'completed' }).eq('id', round.id)
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-sm mb-3">Round Control</h3>
      {currentLive && (
        <div className="mb-3">
          <p className="text-xs text-yellow-400 mb-2">🔴 LIVE: R{currentLive.number} — {currentLive.name}</p>
          <button onClick={() => endRound(currentLive)}
            className="w-full py-2 bg-red-700 hover:bg-red-600 rounded text-sm font-medium">
            End Round {currentLive.number}
          </button>
        </div>
      )}
      {nextUpcoming && !currentLive && (
        <button onClick={() => startRound(nextUpcoming)}
          className="w-full py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-medium">
          Start Round {nextUpcoming.number}: {nextUpcoming.emoji} {nextUpcoming.name}
        </button>
      )}
      {!nextUpcoming && !currentLive && (
        <p className="text-xs text-gray-500 text-center">All rounds complete! 🎉</p>
      )}
    </div>
  )
}
