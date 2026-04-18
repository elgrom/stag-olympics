import type { Team, TeamScore, IndividualScore, Player } from './types'

export function calcTeamTotals(
  teams: Team[],
  scores: TeamScore[],
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const team of teams) {
    totals[team.id] = 0
  }
  for (const score of scores) {
    totals[score.team_id] = (totals[score.team_id] ?? 0) + score.points
  }
  return totals
}

export function calcRoundScores(
  scores: TeamScore[],
): Record<string, Record<string, number>> {
  const byRound: Record<string, Record<string, number>> = {}
  for (const score of scores) {
    if (!byRound[score.round_id]) {
      byRound[score.round_id] = {}
    }
    byRound[score.round_id][score.team_id] =
      (byRound[score.round_id][score.team_id] ?? 0) + score.points
  }
  return byRound
}

export interface PlayerTotal {
  player: Player
  total: number
}

export function calcIndividualTotals(
  players: Player[],
  scores: IndividualScore[],
): PlayerTotal[] {
  const totals: Record<string, number> = {}
  for (const score of scores) {
    totals[score.player_id] = (totals[score.player_id] ?? 0) + score.points
  }

  return players
    .filter(p => totals[p.id] !== undefined)
    .map(p => ({ player: p, total: totals[p.id] }))
    .sort((a, b) => b.total - a.total || b.player.id.localeCompare(a.player.id))
}

export function getLeadingTeamId(
  totals: Record<string, number>,
): string | null {
  const entries = Object.entries(totals)
  if (entries.length < 2) return null
  const sorted = entries.sort((a, b) => b[1] - a[1])
  if (sorted[0][1] === sorted[1][1]) return null
  return sorted[0][0]
}
