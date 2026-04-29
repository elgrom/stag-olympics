import { test as base, type Page } from '@playwright/test'

/** Mock data matching the seed structure */
export const MOCK_TEAMS = [
  { id: 'team-a', name: 'Alpha', created_at: '2026-01-01T00:00:00Z' },
  { id: 'team-b', name: 'Beta', created_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_PLAYERS = [
  { id: 'p1', first_name: 'Cam', last_name: 'Miskin', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
  { id: 'p2', first_name: 'Ricky', last_name: 'Iles', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
  { id: 'p3', first_name: 'Dom', last_name: 'Obrien', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
  { id: 'p4', first_name: 'Iggy', last_name: 'Harris', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_ROUNDS = [
  { id: 'r1', number: 1, name: 'How Well Do You Know Diccon?', emoji: '🧠', scheduled_time: '12:00', format: 'Quiz', scoring_guidance: '', max_team_points: 10, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 1, points_per_loss: 0, status: 'completed', created_at: '2026-01-01T00:00:00Z' },
  { id: 'r2', number: 2, name: 'Petanque', emoji: '🎯', scheduled_time: '12:30', format: 'Best of 3 — 3v3 team matchup', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'live', created_at: '2026-01-01T00:00:00Z' },
  { id: 'r3', number: 3, name: 'Water Balloon Toss', emoji: '💦', scheduled_time: '13:00', format: 'Last pair standing wins', scoring_guidance: '', max_team_points: 3, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
  { id: 'r4', number: 4, name: 'Beer Pong', emoji: '🍺', scheduled_time: '13:30', format: 'Best of 3 — doubles matchup', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
  { id: 'r5', number: 5, name: 'Tennis', emoji: '🎾', scheduled_time: '14:30', format: 'Best of 3 — doubles', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
  { id: 'r6', number: 6, name: 'Taskmaster: Portrait of the Groom', emoji: '🎨', scheduled_time: '15:30', format: '10-minute challenge', scoring_guidance: '', max_team_points: 5, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 5, points_per_loss: 2, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
  { id: 'r7', number: 7, name: 'Dizzy Bat Relay', emoji: '🌀', scheduled_time: '16:00', format: 'Full team relay', scoring_guidance: '', max_team_points: 3, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
  { id: 'r8', number: 8, name: 'Flip Cup Finale', emoji: '🏁', scheduled_time: '16:30', format: 'Full team relay — best of 3', scoring_guidance: '', max_team_points: 5, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 5, points_per_loss: 2, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
]

export const MOCK_FORFEITS = [
  { id: 'f1', text: 'Down your drink', is_used: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'f2', text: 'Eat a chilli', is_used: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'f3', text: 'Shoey', is_used: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'f4', text: 'Cinnamon challenge', is_used: false, created_at: '2026-01-01T00:00:00Z' },
  { id: 'f5', text: 'Sleep with Grahame', is_used: false, created_at: '2026-01-01T00:00:00Z' },
]

/** Intercept all Supabase REST API calls and return mock data */
export async function mockSupabase(page: Page) {
  const supabaseUrl = 'https://lnvsfseworgqytpbgbsu.supabase.co'

  await page.route(`${supabaseUrl}/rest/v1/teams*`, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: MOCK_TEAMS })
    }
    return route.fulfill({ json: MOCK_TEAMS })
  })

  await page.route(`${supabaseUrl}/rest/v1/players*`, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: MOCK_PLAYERS })
    }
    return route.fulfill({ json: [] })
  })

  await page.route(`${supabaseUrl}/rest/v1/rounds*`, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: MOCK_ROUNDS })
    }
    return route.fulfill({ json: [] })
  })

  await page.route(`${supabaseUrl}/rest/v1/team_scores*`, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: [
        { id: 'ts1', round_id: 'r1', team_id: 'team-a', match_number: null, points: 7, created_at: '2026-01-01T00:00:00Z' },
        { id: 'ts2', round_id: 'r1', team_id: 'team-b', match_number: null, points: 5, created_at: '2026-01-01T00:00:00Z' },
      ] })
    }
    return route.fulfill({ json: [] })
  })

  await page.route(`${supabaseUrl}/rest/v1/individual_scores*`, route => {
    return route.fulfill({ json: [] })
  })

  await page.route(`${supabaseUrl}/rest/v1/forfeits*`, route => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ json: MOCK_FORFEITS })
    }
    return route.fulfill({ json: [] })
  })

  await page.route(`${supabaseUrl}/rest/v1/quiz_responses*`, route => {
    return route.fulfill({ json: [] })
  })

  // Block realtime websocket so it doesn't hang
  await page.route(`${supabaseUrl}/realtime/**`, route => route.abort())
}

/** Extended test fixture with Supabase mocking built in */
export const test = base.extend<{ mockPage: Page }>({
  mockPage: async ({ page }, use) => {
    await mockSupabase(page)
    await use(page)
  },
})
