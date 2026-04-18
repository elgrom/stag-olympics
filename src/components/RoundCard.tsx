import type { Round, Team } from '../lib/types'

interface Props {
  round: Round
  teams: Team[]
  scores: Record<string, number> | undefined
}

export function RoundCard({ round, teams, scores }: Props) {
  const isLive = round.status === 'live'
  const isCompleted = round.status === 'completed'
  const isUpcoming = round.status === 'upcoming'

  let winningTeamId: string | null = null
  if (isCompleted && scores && teams.length === 2) {
    const [t1, t2] = teams
    const s1 = scores[t1.id] ?? 0
    const s2 = scores[t2.id] ?? 0
    if (s1 > s2) winningTeamId = t1.id
    else if (s2 > s1) winningTeamId = t2.id
  }

  const borderColor = isLive ? 'border-yellow-500'
    : isCompleted ? (winningTeamId === teams[0]?.id ? 'border-green-600' : 'border-red-600')
    : 'border-gray-700'

  return (
    <div className={`bg-gray-900 rounded-lg p-3 border-l-4 ${borderColor} ${isUpcoming ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center">
        <span className="font-bold text-sm">{round.emoji} R{round.number} {round.name}</span>
        {isLive && <span className="text-xs text-yellow-400 bg-yellow-900/50 px-2 py-0.5 rounded">LIVE</span>}
        {isCompleted && winningTeamId && (
          <span className={`text-xs ${winningTeamId === teams[0]?.id ? 'text-green-400' : 'text-red-400'}`}>
            {teams.find(t => t.id === winningTeamId)?.name} wins!
          </span>
        )}
        {isUpcoming && <span className="text-xs text-gray-500">{round.scheduled_time}</span>}
      </div>
      <p className="text-xs text-gray-500 mt-1">{round.format}</p>
      {scores && isCompleted && (
        <div className="flex gap-2 mt-2">
          {teams.map(team => (
            <div key={team.id} className={`flex-1 text-center text-xs py-1 rounded ${
              team.id === teams[0]?.id ? 'bg-green-950/30' : 'bg-red-950/30'
            }`}>
              <span className={team.id === teams[0]?.id ? 'text-green-400' : 'text-red-400'}>
                +{scores[team.id] ?? 0} pts
              </span>
            </div>
          ))}
        </div>
      )}
      {isLive && <p className="text-xs text-gray-600 mt-2">{round.scoring_guidance}</p>}
      {isUpcoming && <p className="text-xs text-gray-600 mt-1">{round.max_team_points} pts available</p>}
    </div>
  )
}
