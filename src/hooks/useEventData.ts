import { useMemo } from 'react'
import { useRealtimeTable } from './useRealtimeTable'
import { calcTeamTotals, calcRoundScores, calcIndividualTotals, calcIndividualAsTeamScores } from '../lib/scores'
import type { Team, Player, Round, TeamScore, IndividualScore } from '../lib/types'

export function useEventData() {
  const { rows: teams } = useRealtimeTable<Team>('teams')
  const { rows: players } = useRealtimeTable<Player>('players')
  const { rows: rounds, refetch: refetchRounds } = useRealtimeTable<Round>('rounds', { column: 'number', ascending: true })
  const { rows: teamScores } = useRealtimeTable<TeamScore>('team_scores')
  const { rows: individualScores, refetch: refetchIndividualScores } = useRealtimeTable<IndividualScore>('individual_scores')

  // Merge real team_scores with virtual ones from quiz individual scores
  const allTeamScores = useMemo(() => {
    const virtual = calcIndividualAsTeamScores(players, individualScores, teamScores)
    return [...teamScores, ...virtual]
  }, [players, individualScores, teamScores])

  const totals = useMemo(() => calcTeamTotals(teams, allTeamScores), [teams, allTeamScores])
  const roundScores = useMemo(() => calcRoundScores(allTeamScores), [allTeamScores])
  const individualRankings = useMemo(() => calcIndividualTotals(players, individualScores), [players, individualScores])
  const currentRound = useMemo(() => rounds.find(r => r.status === 'live') ?? null, [rounds])

  return { teams, players, rounds, teamScores, individualScores, totals, roundScores, individualRankings, currentRound, refetchRounds, refetchIndividualScores }
}
