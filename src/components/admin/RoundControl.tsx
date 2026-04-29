import { supabase } from '../../lib/supabase'
import { FORFEITS } from '../../seed/data'
import type { Round } from '../../lib/types'

interface Props {
  rounds: Round[]
  onRefetch: () => void
  onRefetchAll: () => void
  onResetCeremony?: () => void
}

export function RoundControl({ rounds, onRefetch, onRefetchAll, onResetCeremony }: Props) {
  const currentLive = rounds.find(r => r.status === 'live')
  const nextUpcoming = rounds.filter(r => r.status === 'upcoming').sort((a, b) => a.number - b.number)[0]

  const startRound = async (round: Round) => {
    if (currentLive) {
      await supabase.from('rounds').update({ status: 'completed' }).eq('id', currentLive.id)
    }
    await supabase.from('rounds').update({ status: 'live' }).eq('id', round.id)
    onRefetch()
  }

  const endRound = async (round: Round) => {
    await supabase.from('rounds').update({ status: 'completed' }).eq('id', round.id)
    onRefetch()
  }

  const restartAll = async () => {
    if (!confirm('Restart ALL rounds? This wipes every score and resets everything.')) return
    if (!confirm('Are you sure? This cannot be undone.')) return
    await supabase.from('individual_scores').delete().gte('created_at', '1970-01-01')
    await supabase.from('team_scores').delete().gte('created_at', '1970-01-01')
    await supabase.from('quiz_responses').delete().gte('created_at', '1970-01-01')
    await supabase.from('rounds').update({ status: 'upcoming' }).gte('created_at', '1970-01-01')
    await supabase.from('players').update({ team_id: null }).gte('created_at', '1970-01-01')
    // Reset forfeits to seed data
    await supabase.from('forfeits').delete().gte('created_at', '1970-01-01')
    await supabase.from('forfeits').insert(FORFEITS.map(text => ({ text })))
    onResetCeremony?.()
    onRefetchAll()
  }

  const restartRound = async (round: Round) => {
    if (!confirm(`Restart R${round.number} ${round.name}? This wipes its scores.`)) return
    // End any currently live round
    if (currentLive) {
      await supabase.from('rounds').update({ status: 'completed' }).eq('id', currentLive.id)
    }
    // Wipe scores for this round
    await supabase.from('individual_scores').delete().eq('round_id', round.id)
    await supabase.from('team_scores').delete().eq('round_id', round.id)
    // Set it live
    await supabase.from('rounds').update({ status: 'live' }).eq('id', round.id)
    onRefetch()
  }

  const completed = rounds.filter(r => r.status === 'completed').sort((a, b) => a.number - b.number)

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-sm mb-3">Round Control</h3>
      {currentLive && (
        <div className="mb-3">
          <p className="text-xs text-yellow-400 mb-2">🔴 LIVE: R{currentLive.number} — {currentLive.name}</p>
          <div className="flex gap-2">
            <button onClick={() => endRound(currentLive)}
              className="flex-1 py-2 bg-red-700 hover:bg-red-600 rounded text-sm font-medium">
              End Round
            </button>
            <button onClick={() => restartRound(currentLive)}
              className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium text-gray-300">
              🔄 Restart
            </button>
          </div>
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
      {completed.length > 0 && !currentLive && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 mb-2">Restart a completed round:</p>
          <div className="flex flex-wrap gap-1">
            {completed.map(r => (
              <button key={r.id} onClick={() => restartRound(r)}
                className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-400">
                R{r.number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Restart all */}
      <button onClick={restartAll}
        className="w-full py-2 mt-3 bg-gray-800 hover:bg-gray-700 rounded text-xs text-red-400">
        ☠️ Restart entire event
      </button>
    </div>
  )
}
