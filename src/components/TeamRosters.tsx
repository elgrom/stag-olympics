import { displayName } from '../lib/types'
import type { Team, Player } from '../lib/types'

interface Props {
  teams: Team[]
  players: Player[]
}

export function TeamRosters({ teams, players }: Props) {
  const unassigned = players.filter(p => !p.team_id)

  return (
    <div className="px-4 pt-6 pb-24">
      <h2 className="text-xl font-bold text-center mb-4">👥 Teams</h2>
      <div className="grid grid-cols-2 gap-3">
        {teams.map((team, i) => {
          const teamPlayers = players.filter(p => p.team_id === team.id).sort((a, b) => a.first_name.localeCompare(b.first_name))
          const color = i === 0 ? 'border-green-600' : 'border-red-600'
          return (
            <div key={team.id} className={`bg-gray-900 rounded-lg p-3 border-t-2 ${color}`}>
              <h3 className="font-bold text-sm text-center mb-2">{team.name}</h3>
              {teamPlayers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center">Draft pending</p>
              ) : (
                <ul className="space-y-1">
                  {teamPlayers.map(p => (
                    <li key={p.id} className="text-xs text-gray-300">{displayName(p)}</li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
      {unassigned.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm text-gray-500 text-center mb-2">Awaiting draft ({unassigned.length})</h3>
          <div className="flex flex-wrap gap-1 justify-center">
            {unassigned.map(p => (
              <span key={p.id} className="text-xs bg-gray-800 px-2 py-1 rounded">{displayName(p)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
