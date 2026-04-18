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

/**
 * For rounds with no team_scores (e.g. the quiz), create virtual team scores
 * by summing individual scores grouped by each player's team.
 */
export function calcIndividualAsTeamScores(
  players: Player[],
  individualScores: IndividualScore[],
  teamScores: TeamScore[],
): TeamScore[] {
  // Find which rounds already have team_scores
  const roundsWithTeamScores = new Set(teamScores.map(s => s.round_id))

  // Only process individual scores for rounds WITHOUT team_scores
  const orphanedScores = individualScores.filter(
    s => !roundsWithTeamScores.has(s.round_id)
  )

  // Build a player -> team lookup
  const playerTeam: Record<string, string> = {}
  for (const p of players) {
    if (p.team_id) playerTeam[p.id] = p.team_id
  }

  // Sum by round + team
  const grouped: Record<string, Record<string, number>> = {}
  for (const s of orphanedScores) {
    const teamId = playerTeam[s.player_id]
    if (!teamId) continue
    if (!grouped[s.round_id]) grouped[s.round_id] = {}
    grouped[s.round_id][teamId] = (grouped[s.round_id][teamId] ?? 0) + s.points
  }

  // Convert to TeamScore-shaped objects
  const virtual: TeamScore[] = []
  for (const [roundId, teams] of Object.entries(grouped)) {
    for (const [teamId, points] of Object.entries(teams)) {
      virtual.push({
        id: `virtual-${roundId}-${teamId}`,
        round_id: roundId,
        team_id: teamId,
        match_number: null,
        points,
        created_at: '',
      })
    }
  }
  return virtual
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
