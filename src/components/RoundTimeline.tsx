import type { Round, Team } from '../lib/types'
import { RoundCard } from './RoundCard'

interface Props {
  rounds: Round[]
  teams: Team[]
  roundScores: Record<string, Record<string, number>>
}

export function RoundTimeline({ rounds, teams, roundScores }: Props) {
  const completed = rounds.filter(r => r.status === 'completed').sort((a, b) => b.number - a.number)
  const live = rounds.filter(r => r.status === 'live')
  const upcoming = rounds.filter(r => r.status === 'upcoming').sort((a, b) => a.number - b.number)
  const ordered = [...live, ...completed, ...upcoming]

  return (
    <div className="px-4 space-y-2 pb-24">
      {live.length === 0 && completed.length === 0 && (
        <p className="text-center text-gray-500 text-sm py-8">No rounds started yet</p>
      )}
      {ordered.map(round => (
        <RoundCard key={round.id} round={round} teams={teams} scores={roundScores[round.id]} />
      ))}
    </div>
  )
}
