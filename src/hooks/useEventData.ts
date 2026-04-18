import { useMemo } from 'react'
import { useRealtimeTable } from './useRealtimeTable'
import { calcTeamTotals, calcRoundScores, calcIndividualTotals } from '../lib/scores'
import type { Team, Player, Round, TeamScore, IndividualScore } from '../lib/types'

export function useEventData() {
  const teams = useRealtimeTable<Team>('teams')
  const players = useRealtimeTable<Player>('players')
  const rounds = useRealtimeTable<Round>('rounds', { column: 'number', ascending: true })
  const teamScores = useRealtimeTable<TeamScore>('team_scores')
  const individualScores = useRealtimeTable<IndividualScore>('individual_scores')

  const totals = useMemo(() => calcTeamTotals(teams, teamScores), [teams, teamScores])
  const roundScores = useMemo(() => calcRoundScores(teamScores), [teamScores])
  const individualRankings = useMemo(() => calcIndividualTotals(players, individualScores), [players, individualScores])
  const currentRound = useMemo(() => rounds.find(r => r.status === 'live') ?? null, [rounds])

  return { teams, players, rounds, teamScores, individualScores, totals, roundScores, individualRankings, currentRound }
}
