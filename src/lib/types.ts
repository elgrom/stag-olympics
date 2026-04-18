export interface Team {
  id: string
  name: string
  created_at: string
}

export interface Player {
  id: string
  first_name: string
  last_name: string
  team_id: string | null
  created_at: string
}

export interface Round {
  id: string
  number: number
  name: string
  emoji: string | null
  scheduled_time: string | null
  format: string | null
  scoring_guidance: string | null
  max_team_points: number | null
  has_individual_scoring: boolean
  has_sub_matches: boolean
  sub_match_count: number | null
  points_per_win: number
  points_per_loss: number
  status: 'upcoming' | 'live' | 'completed'
  created_at: string
}

export interface TeamScore {
  id: string
  round_id: string
  team_id: string
  match_number: number | null
  points: number
  created_at: string
}

export interface IndividualScore {
  id: string
  round_id: string
  player_id: string
  match_number: number | null
  points: number
  created_at: string
}

export interface Forfeit {
  id: string
  text: string
  is_used: boolean
  created_at: string
}
