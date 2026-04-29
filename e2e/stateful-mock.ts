import { type Page } from '@playwright/test'

/**
 * Stateful Supabase mock that tracks data changes throughout a full playthrough.
 * When the app POSTs/PATCHes/DELETEs, the in-memory state updates so subsequent
 * GETs return the correct data — just like a real database.
 */
export function createStatefulMock() {
  let idCounter = 100

  const teams = [
    { id: 'team-a', name: 'Stags', created_at: '2026-01-01T00:00:00Z' },
    { id: 'team-b', name: 'Bucks', created_at: '2026-01-01T00:00:00Z' },
  ]

  // 8 players per team so lineups work for petanque (3v3), beer pong (2v2), tennis (2v2)
  const players = [
    { id: 'p1', first_name: 'Cam', last_name: 'Miskin', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p2', first_name: 'Ricky', last_name: 'Iles', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p3', first_name: 'Adam', last_name: 'Broomhead', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p4', first_name: 'Brandon', last_name: 'Austin', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p5', first_name: 'Ady', last_name: 'LeRoux', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p6', first_name: 'Seb', last_name: 'Mayfield', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p7', first_name: 'Pedro', last_name: 'Leon', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p8', first_name: 'Marc', last_name: 'Sparrow', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p9', first_name: 'Dom', last_name: 'Obrien', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p10', first_name: 'Iggy', last_name: 'Harris', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p11', first_name: 'Bryan', last_name: 'Bennet', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p12', first_name: 'Ian', last_name: 'Dyckhoff', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p13', first_name: 'Grahame', last_name: 'Johnston', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p14', first_name: 'Jonathan', last_name: 'Midgely', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p15', first_name: 'Simon', last_name: 'None', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p16', first_name: 'Dom', last_name: 'Andre', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
  ]

  const rounds = [
    { id: 'r1', number: 1, name: 'How Well Do You Know Diccon?', emoji: '🧠', scheduled_time: '12:00', format: 'Quiz', scoring_guidance: 'Enter the number of correct answers for each team (0–10)', max_team_points: 10, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 1, points_per_loss: 0, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r2', number: 2, name: 'Petanque', emoji: '🎯', scheduled_time: '12:30', format: 'Best of 3 — 3v3 team matchup', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r3', number: 3, name: 'Water Balloon Toss', emoji: '💦', scheduled_time: '13:00', format: 'Last pair standing wins', scoring_guidance: '', max_team_points: 3, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r4', number: 4, name: 'Beer Pong', emoji: '🍺', scheduled_time: '13:30', format: 'Best of 3 — doubles matchup', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r5', number: 5, name: 'Tennis', emoji: '🎾', scheduled_time: '14:30', format: 'Best of 3 — doubles', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r6', number: 6, name: 'Taskmaster: Portrait of the Groom', emoji: '🎨', scheduled_time: '15:30', format: '10-minute challenge', scoring_guidance: '', max_team_points: 5, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 5, points_per_loss: 2, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r7', number: 7, name: 'Dizzy Bat Relay', emoji: '🌀', scheduled_time: '16:00', format: 'Full team relay', scoring_guidance: '', max_team_points: 3, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r8', number: 8, name: 'Flip Cup Finale', emoji: '🏁', scheduled_time: '16:30', format: 'Full team relay — best of 3', scoring_guidance: '', max_team_points: 5, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 5, points_per_loss: 2, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
  ]

  let teamScores: any[] = []
  let individualScores: any[] = []

  const forfeits = [
    { id: 'f1', text: 'Down your drink', is_used: false, created_at: '2026-01-01T00:00:00Z' },
    { id: 'f2', text: 'Eat a chilli', is_used: false, created_at: '2026-01-01T00:00:00Z' },
    { id: 'f3', text: 'Shoey', is_used: false, created_at: '2026-01-01T00:00:00Z' },
  ]

  function nextId() { return `mock-${++idCounter}` }

  /** Parse PostgREST query params from a URL */
  function parseFilters(url: string) {
    const u = new URL(url)
    const filters: Record<string, string> = {}
    for (const [key, value] of u.searchParams) {
      if (key !== 'select' && key !== 'order') {
        filters[key] = value
      }
    }
    return filters
  }

  return {
    teams,
    players,
    rounds,
    teamScores,
    individualScores,
    forfeits,

    async install(page: Page) {
      const supabaseUrl = 'https://lnvsfseworgqytpbgbsu.supabase.co'

      // --- TEAMS ---
      await page.route(`${supabaseUrl}/rest/v1/teams*`, route => {
        return route.fulfill({ json: teams })
      })

      // --- PLAYERS ---
      await page.route(`${supabaseUrl}/rest/v1/players*`, route => {
        if (route.request().method() === 'PATCH') {
          // Player updates (team assignment, nickname)
          const body = route.request().postDataJSON()
          const filters = parseFilters(route.request().url())
          const id = filters['id']?.replace('eq.', '')
          if (id) {
            const player = players.find(p => p.id === id)
            if (player) Object.assign(player, body)
          }
          return route.fulfill({ json: [] })
        }
        return route.fulfill({ json: players })
      })

      // --- ROUNDS ---
      await page.route(`${supabaseUrl}/rest/v1/rounds*`, route => {
        if (route.request().method() === 'PATCH') {
          const body = route.request().postDataJSON()
          const url = route.request().url()
          const filters = parseFilters(url)
          const id = filters['id']?.replace('eq.', '')
          if (id) {
            const round = rounds.find(r => r.id === id)
            if (round) Object.assign(round, body)
          } else {
            // Bulk update (e.g., restart all)
            for (const round of rounds) Object.assign(round, body)
          }
          return route.fulfill({ json: [] })
        }
        // Return sorted by number
        const sorted = [...rounds].sort((a, b) => a.number - b.number)
        return route.fulfill({ json: sorted })
      })

      // --- TEAM SCORES ---
      await page.route(`${supabaseUrl}/rest/v1/team_scores*`, route => {
        if (route.request().method() === 'POST') {
          const body = route.request().postDataJSON()
          const rows = Array.isArray(body) ? body : [body]
          for (const row of rows) {
            teamScores.push({ ...row, id: nextId(), created_at: new Date().toISOString() })
          }
          return route.fulfill({ json: rows })
        }
        if (route.request().method() === 'DELETE') {
          const filters = parseFilters(route.request().url())
          const roundId = filters['round_id']?.replace('eq.', '')
          if (roundId) {
            teamScores = teamScores.filter(s => s.round_id !== roundId)
          } else {
            teamScores = []
          }
          return route.fulfill({ json: [] })
        }
        return route.fulfill({ json: teamScores })
      })

      // --- INDIVIDUAL SCORES ---
      await page.route(`${supabaseUrl}/rest/v1/individual_scores*`, route => {
        if (route.request().method() === 'POST') {
          const body = route.request().postDataJSON()
          const rows = Array.isArray(body) ? body : [body]
          for (const row of rows) {
            individualScores.push({ ...row, id: nextId(), created_at: new Date().toISOString() })
          }
          return route.fulfill({ json: rows })
        }
        if (route.request().method() === 'DELETE') {
          const filters = parseFilters(route.request().url())
          const roundId = filters['round_id']?.replace('eq.', '')
          if (roundId) {
            individualScores = individualScores.filter(s => s.round_id !== roundId)
          } else {
            individualScores = []
          }
          return route.fulfill({ json: [] })
        }
        return route.fulfill({ json: individualScores })
      })

      // --- FORFEITS ---
      await page.route(`${supabaseUrl}/rest/v1/forfeits*`, route => {
        if (route.request().method() === 'PATCH') {
          const body = route.request().postDataJSON()
          const filters = parseFilters(route.request().url())
          const id = filters['id']?.replace('eq.', '')
          if (id) {
            const f = forfeits.find(f => f.id === id)
            if (f) Object.assign(f, body)
          }
          return route.fulfill({ json: [] })
        }
        return route.fulfill({ json: forfeits })
      })

      // --- QUIZ RESPONSES ---
      await page.route(`${supabaseUrl}/rest/v1/quiz_responses*`, route => {
        return route.fulfill({ json: [] })
      })

      // --- CEREMONY STATE ---
      const ceremonyState = { id: 'cs1', phase: 'idle', winner_name: null, loser_name: null, stag_forfeit: null, loser_forfeit: null, loser_penalty: null, updated_at: '2026-01-01T00:00:00Z' }
      await page.route(`${supabaseUrl}/rest/v1/ceremony_state*`, route => {
        if (route.request().method() === 'PATCH') {
          const body = route.request().postDataJSON()
          Object.assign(ceremonyState, body)
          return route.fulfill({ json: [] })
        }
        const accept = route.request().headers()['accept'] ?? ''
        if (accept.includes('vnd.pgrst.object')) {
          return route.fulfill({ json: ceremonyState, headers: { 'content-range': '0-0/1' } })
        }
        return route.fulfill({ json: [ceremonyState] })
      })

      // Block realtime websocket
      await page.route(`${supabaseUrl}/realtime/**`, route => route.abort())
    },
  }
}
