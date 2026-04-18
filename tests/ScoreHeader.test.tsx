import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreHeader } from '../src/components/ScoreHeader'
import type { Team, Round } from '../src/lib/types'

const teams: Team[] = [
  { id: 'a', name: 'Alpha', created_at: '' },
  { id: 'b', name: 'Beta', created_at: '' },
]

const liveRound: Round = {
  id: 'r4', number: 4, name: 'Beer Pong', emoji: '🍺', scheduled_time: '13:30',
  format: '', scoring_guidance: '', max_team_points: 9,
  has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3,
  points_per_win: 3, points_per_loss: 1, status: 'live', created_at: '',
}

describe('ScoreHeader', () => {
  it('renders team names and scores', () => {
    render(<ScoreHeader teams={teams} totals={{ a: 24, b: 19 }} currentRound={liveRound} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('19')).toBeInTheDocument()
  })

  it('shows current round info', () => {
    render(<ScoreHeader teams={teams} totals={{ a: 24, b: 19 }} currentRound={liveRound} />)
    expect(screen.getByText(/Round 4 of 8/)).toBeInTheDocument()
    expect(screen.getByText(/Beer Pong/)).toBeInTheDocument()
  })

  it('highlights the leading team', () => {
    const { container } = render(<ScoreHeader teams={teams} totals={{ a: 24, b: 19 }} currentRound={liveRound} />)
    const leadingBox = container.querySelector('[data-leading="true"]')
    expect(leadingBox).toBeInTheDocument()
    expect(leadingBox?.textContent).toContain('Alpha')
  })
})
