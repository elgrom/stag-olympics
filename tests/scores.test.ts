import { describe, it, expect } from 'vitest'
import {
  calcTeamTotals,
  calcRoundScores,
  calcIndividualTotals,
  getLeadingTeamId,
} from '../src/lib/scores'
import type { Team, TeamScore, IndividualScore, Player, Round } from '../src/lib/types'

const teamA: Team = { id: 'a', name: 'Alpha', created_at: '' }
const teamB: Team = { id: 'b', name: 'Beta', created_at: '' }
const teams = [teamA, teamB]

describe('calcTeamTotals', () => {
  it('returns zero for both teams when no scores', () => {
    const result = calcTeamTotals(teams, [])
    expect(result).toEqual({ a: 0, b: 0 })
  })

  it('sums scores across rounds', () => {
    const scores: TeamScore[] = [
      { id: '1', round_id: 'r1', team_id: 'a', match_number: null, points: 7, created_at: '' },
      { id: '2', round_id: 'r1', team_id: 'b', match_number: null, points: 4, created_at: '' },
      { id: '3', round_id: 'r2', team_id: 'a', match_number: 1, points: 3, created_at: '' },
      { id: '4', round_id: 'r2', team_id: 'b', match_number: 1, points: 1, created_at: '' },
    ]
    const result = calcTeamTotals(teams, scores)
    expect(result).toEqual({ a: 10, b: 5 })
  })
})

describe('calcRoundScores', () => {
  it('returns scores grouped by round', () => {
    const scores: TeamScore[] = [
      { id: '1', round_id: 'r1', team_id: 'a', match_number: null, points: 7, created_at: '' },
      { id: '2', round_id: 'r1', team_id: 'b', match_number: null, points: 4, created_at: '' },
      { id: '3', round_id: 'r2', team_id: 'a', match_number: 1, points: 3, created_at: '' },
      { id: '4', round_id: 'r2', team_id: 'b', match_number: 1, points: 1, created_at: '' },
    ]
    const result = calcRoundScores(scores)
    expect(result['r1']).toEqual({ a: 7, b: 4 })
    expect(result['r2']).toEqual({ a: 3, b: 1 })
  })

  it('sums sub-match scores within a round', () => {
    const scores: TeamScore[] = [
      { id: '1', round_id: 'r2', team_id: 'a', match_number: 1, points: 3, created_at: '' },
      { id: '2', round_id: 'r2', team_id: 'b', match_number: 1, points: 1, created_at: '' },
      { id: '3', round_id: 'r2', team_id: 'a', match_number: 2, points: 1, created_at: '' },
      { id: '4', round_id: 'r2', team_id: 'b', match_number: 2, points: 3, created_at: '' },
    ]
    const result = calcRoundScores(scores)
    expect(result['r2']).toEqual({ a: 4, b: 4 })
  })
})

describe('calcIndividualTotals', () => {
  it('returns empty array when no scores', () => {
    const result = calcIndividualTotals([], [])
    expect(result).toEqual([])
  })

  it('sums individual points and sorts descending', () => {
    const players: Player[] = [
      { id: 'p1', first_name: 'Cam', last_name: 'Miskin', team_id: 'a', created_at: '' },
      { id: 'p2', first_name: 'Ricky', last_name: 'Iles', team_id: 'a', created_at: '' },
      { id: 'p3', first_name: 'Dom', last_name: 'Obrien', team_id: 'b', created_at: '' },
    ]
    const scores: IndividualScore[] = [
      { id: '1', round_id: 'r2', player_id: 'p1', match_number: 1, points: 1, created_at: '' },
      { id: '2', round_id: 'r2', player_id: 'p2', match_number: 1, points: 1, created_at: '' },
      { id: '3', round_id: 'r2', player_id: 'p1', match_number: 2, points: 1, created_at: '' },
      { id: '4', round_id: 'r2', player_id: 'p3', match_number: 2, points: 1, created_at: '' },
    ]
    const result = calcIndividualTotals(players, scores)
    expect(result[0]).toEqual({ player: players[0], total: 2 })
    expect(result[1]).toEqual({ player: players[2], total: 1 })
    expect(result[2]).toEqual({ player: players[1], total: 1 })
  })
})

describe('getLeadingTeamId', () => {
  it('returns the team id with more points', () => {
    const totals = { a: 10, b: 7 }
    expect(getLeadingTeamId(totals)).toBe('a')
  })

  it('returns null when tied', () => {
    const totals = { a: 5, b: 5 }
    expect(getLeadingTeamId(totals)).toBeNull()
  })
})
