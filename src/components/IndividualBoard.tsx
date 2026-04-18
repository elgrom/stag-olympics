import type { PlayerTotal } from '../lib/scores'
import type { Team } from '../lib/types'

interface Props {
  rankings: PlayerTotal[]
  teams: Team[]
}

export function IndividualBoard({ rankings, teams }: Props) {
  if (rankings.length === 0) {
    return <div className="px-4 py-8 text-center text-gray-500 text-sm">No individual scores yet</div>
  }

  const lastIdx = rankings.length - 1

  return (
    <div className="px-4 pb-24">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase">
            <th className="text-left py-2 w-8">#</th>
            <th className="text-left py-2">Player</th>
            <th className="text-right py-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((entry, i) => {
            const isMvp = i === 0
            const isSpoon = i === lastIdx && rankings.length > 1
            const teamColor = teams.find(t => t.id === entry.player.team_id) === teams[0]
              ? 'bg-green-600' : 'bg-red-600'
            return (
              <tr key={entry.player.id}
                className={`border-b border-gray-800 ${isMvp ? 'bg-yellow-900/20' : isSpoon ? 'bg-gray-800/30' : ''}`}>
                <td className="py-2 text-gray-400">{isMvp ? '🏅' : isSpoon ? '🥄' : i + 1}</td>
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${teamColor}`} />
                    {entry.player.first_name} {entry.player.last_name}
                  </span>
                </td>
                <td className="py-2 text-right font-bold">{entry.total}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
