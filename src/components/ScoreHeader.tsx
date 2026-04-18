import type { Team, Round } from '../lib/types'
import { getLeadingTeamId } from '../lib/scores'

interface Props {
  teams: Team[]
  totals: Record<string, number>
  currentRound: Round | null
}

export function ScoreHeader({ teams, totals, currentRound }: Props) {
  const leadingId = getLeadingTeamId(totals)
  const totalPoints = Object.values(totals).reduce((a, b) => a + b, 0)

  return (
    <div className="px-4 pt-6 pb-4">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">🏆 Stag Olympics</h1>
        {currentRound && (
          <p className="text-sm text-gray-400 mt-1">
            Round {currentRound.number} of 8 — {currentRound.emoji} {currentRound.name}
          </p>
        )}
      </div>

      <div className="flex gap-3 mb-3">
        {teams.map(team => {
          const isLeading = team.id === leadingId
          return (
            <div key={team.id} data-leading={isLeading}
              className={`flex-1 rounded-xl p-4 text-center border-2 ${
                isLeading ? 'bg-green-950/50 border-green-600' : 'bg-gray-900 border-gray-700'
              }`}>
              <div className={`text-xs uppercase tracking-widest ${isLeading ? 'text-green-500' : 'text-gray-400'}`}>
                {team.name}
              </div>
              <div className={`text-4xl font-bold mt-1 ${isLeading ? 'text-green-400' : 'text-gray-200'}`}>
                {totals[team.id] ?? 0}
              </div>
              {isLeading && <div className="text-xs text-green-500 mt-1">⭐ Leading</div>}
            </div>
          )
        })}
      </div>

      {totalPoints > 0 && (
        <div className="flex h-1.5 rounded-full overflow-hidden">
          {teams.map((team, i) => (
            <div key={team.id} className={i === 0 ? 'bg-green-600' : 'bg-red-600'}
              style={{ flex: totals[team.id] ?? 0 }} />
          ))}
        </div>
      )}
    </div>
  )
}
