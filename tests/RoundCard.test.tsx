import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RoundCard } from '../src/components/RoundCard'
import type { Round, Team } from '../src/lib/types'

const teams: Team[] = [
  { id: 'a', name: 'Alpha', created_at: '' },
  { id: 'b', name: 'Beta', created_at: '' },
]

function makeRound(overrides: Partial<Round> = {}): Round {
  return {
    id: 'r2', number: 2, name: 'Petanque', emoji: '🎯', scheduled_time: '12:30',
    format: 'Best of 3 — 3v3 team matchup', scoring_guidance: '', max_team_points: 9,
    has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3,
    points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '',
    ...overrides,
  }
}

describe('RoundCard', () => {
  it('renders round name and format', () => {
    render(<RoundCard round={makeRound()} teams={teams} scores={undefined} />)
    expect(screen.getByText(/Petanque/)).toBeInTheDocument()
    expect(screen.getByText(/Best of 3/)).toBeInTheDocument()
  })

  it('shows "How to play" toggle', () => {
    render(<RoundCard round={makeRound()} teams={teams} scores={undefined} />)
    expect(screen.getByText(/How to play/)).toBeInTheDocument()
  })

  it('expands to show format and scoring on click', () => {
    render(<RoundCard round={makeRound()} teams={teams} scores={undefined} />)
    fireEvent.click(screen.getByText(/How to play/))
    expect(screen.getByText('Format')).toBeInTheDocument()
    expect(screen.getByText('Scoring')).toBeInTheDocument()
  })

  it('shows game rules for petanque when expanded', () => {
    render(<RoundCard round={makeRound()} teams={teams} scores={undefined} />)
    fireEvent.click(screen.getByText(/How to play/))
    expect(screen.getByText('Game Rules')).toBeInTheDocument()
    const rules = screen.getAllByRole('listitem')
    expect(rules.length).toBeGreaterThan(0)
    expect(rules.some(li => li.textContent?.includes('cochonnet'))).toBe(true)
    expect(rules.some(li => li.textContent?.includes('13 points'))).toBe(true)
  })

  it('shows game rules for tennis when expanded', () => {
    const tennis = makeRound({ id: 'r5', number: 5, name: 'Tennis', emoji: '🎾' })
    render(<RoundCard round={tennis} teams={teams} scores={undefined} />)
    fireEvent.click(screen.getByText(/How to play/))
    expect(screen.getByText('Game Rules')).toBeInTheDocument()
    const rules = screen.getAllByRole('listitem')
    expect(rules.some(li => li.textContent?.includes('No deuces'))).toBe(true)
    expect(rules.some(li => li.textContent?.includes('11'))).toBe(true)
  })

  it('shows penalty for rounds that have one', () => {
    render(<RoundCard round={makeRound()} teams={teams} scores={undefined} />)
    fireEvent.click(screen.getByText(/How to play/))
    expect(screen.getByText('Loser penalty')).toBeInTheDocument()
    expect(screen.getByText(/Oven mitts/)).toBeInTheDocument()
  })

  it('does not show game rules for rounds without them', () => {
    const waterBalloon = makeRound({ id: 'r3', number: 3, name: 'Water Balloon Toss', emoji: '💦' })
    render(<RoundCard round={waterBalloon} teams={teams} scores={undefined} />)
    fireEvent.click(screen.getByText(/How to play/))
    expect(screen.queryByText('Game Rules')).not.toBeInTheDocument()
  })

  it('collapses info on second click', () => {
    render(<RoundCard round={makeRound()} teams={teams} scores={undefined} />)
    fireEvent.click(screen.getByText(/How to play/))
    expect(screen.getByText('Format')).toBeInTheDocument()
    fireEvent.click(screen.getByText(/Hide info/))
    expect(screen.queryByText('Game Rules')).not.toBeInTheDocument()
  })

  it('shows LIVE badge for live rounds', () => {
    render(<RoundCard round={makeRound({ status: 'live' })} teams={teams} scores={undefined} />)
    expect(screen.getByText('LIVE')).toBeInTheDocument()
  })

  it('shows winner for completed rounds', () => {
    const round = makeRound({ status: 'completed' })
    render(<RoundCard round={round} teams={teams} scores={{ a: 6, b: 3 }} />)
    expect(screen.getByText('Alpha wins!')).toBeInTheDocument()
  })
})
