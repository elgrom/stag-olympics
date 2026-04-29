import { test, expect, type Page } from '@playwright/test'

const SUPABASE_URL = 'https://lnvsfseworgqytpbgbsu.supabase.co'

/**
 * Edge case tests for things that could go wrong on the day.
 */
test.describe('Edge Cases', () => {
  const teams = [
    { id: 'team-a', name: 'Stags', created_at: '2026-01-01T00:00:00Z' },
    { id: 'team-b', name: 'Bucks', created_at: '2026-01-01T00:00:00Z' },
  ]

  // 9 per team so petanque 3v3 x 3 matches works (each player used once)
  const players = [
    { id: 'p1', first_name: 'Cam', last_name: 'Miskin', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p2', first_name: 'Ricky', last_name: 'Iles', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p3', first_name: 'Adam', last_name: 'Broomhead', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p4', first_name: 'Brandon', last_name: 'Austin', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p5', first_name: 'Ady', last_name: 'LeRoux', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p6', first_name: 'Seb', last_name: 'Mayfield', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p7', first_name: 'Pedro', last_name: 'Leon', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p8', first_name: 'Marc', last_name: 'Sparrow', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p9', first_name: 'Simon', last_name: 'None', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p10', first_name: 'Dom', last_name: 'Obrien', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p11', first_name: 'Iggy', last_name: 'Harris', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p12', first_name: 'Bryan', last_name: 'Bennet', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p13', first_name: 'Ian', last_name: 'Dyckhoff', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p14', first_name: 'Grahame', last_name: 'Johnston', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p15', first_name: 'Jonathan', last_name: 'Midgely', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p16', first_name: 'Dom', last_name: 'Andre', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p17', first_name: 'Diccon', last_name: 'Mayfield', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p18', first_name: 'Liam', last_name: 'Jones', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
  ]

  let teamScores: any[] = []
  let individualScores: any[] = []
  let idCounter = 100

  const ceremonyState = { id: 'cs1', phase: 'idle', winner_name: null, loser_name: null, stag_forfeit: null, loser_forfeit: null, loser_penalty: null, updated_at: '2026-01-01T00:00:00Z' }

  function makeRounds(overrides: Record<string, any> = {}) {
    return [
      { id: 'r1', number: 1, name: 'Quiz', emoji: '🧠', scheduled_time: '12:00', format: 'Quiz', scoring_guidance: '', max_team_points: 10, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 1, points_per_loss: 0, status: 'completed', created_at: '2026-01-01T00:00:00Z', ...overrides },
      { id: 'r2', number: 2, name: 'Petanque', emoji: '🎯', scheduled_time: '12:30', format: 'Best of 3', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'live', created_at: '2026-01-01T00:00:00Z' },
      { id: 'r3', number: 3, name: 'Water Balloon Toss', emoji: '💦', scheduled_time: '13:00', format: 'Last pair standing', scoring_guidance: '', max_team_points: 3, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
    ]
  }

  async function installMock(page: Page, rounds: any[]) {
    teamScores = []
    individualScores = []
    idCounter = 100
    Object.assign(ceremonyState, { phase: 'idle', winner_name: null, loser_name: null, stag_forfeit: null, loser_forfeit: null, loser_penalty: null })

    await page.route(`${SUPABASE_URL}/rest/v1/teams*`, route => route.fulfill({ json: teams }))
    await page.route(`${SUPABASE_URL}/rest/v1/players*`, route => route.fulfill({ json: players }))
    await page.route(`${SUPABASE_URL}/rest/v1/rounds*`, route => {
      if (route.request().method() === 'PATCH') return route.fulfill({ json: [] })
      return route.fulfill({ json: [...rounds].sort((a, b) => a.number - b.number) })
    })
    await page.route(`${SUPABASE_URL}/rest/v1/team_scores*`, route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        const rows = Array.isArray(body) ? body : [body]
        for (const row of rows) teamScores.push({ ...row, id: `mock-${++idCounter}`, created_at: new Date().toISOString() })
        return route.fulfill({ json: rows })
      }
      if (route.request().method() === 'DELETE') { teamScores = []; return route.fulfill({ json: [] }) }
      return route.fulfill({ json: teamScores })
    })
    await page.route(`${SUPABASE_URL}/rest/v1/individual_scores*`, route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        const rows = Array.isArray(body) ? body : [body]
        for (const row of rows) individualScores.push({ ...row, id: `mock-${++idCounter}`, created_at: new Date().toISOString() })
        return route.fulfill({ json: rows })
      }
      if (route.request().method() === 'DELETE') { individualScores = []; return route.fulfill({ json: [] }) }
      return route.fulfill({ json: individualScores })
    })
    await page.route(`${SUPABASE_URL}/rest/v1/forfeits*`, route => route.fulfill({ json: [] }))
    await page.route(`${SUPABASE_URL}/rest/v1/quiz_responses*`, route => route.fulfill({ json: [] }))
    await page.route(`${SUPABASE_URL}/rest/v1/ceremony_state*`, route => {
      if (route.request().method() === 'PATCH') {
        Object.assign(ceremonyState, route.request().postDataJSON())
        return route.fulfill({ json: [] })
      }
      const accept = route.request().headers()['accept'] ?? ''
      if (accept.includes('vnd.pgrst.object')) return route.fulfill({ json: { ...ceremonyState }, headers: { 'content-range': '0-0/1' } })
      return route.fulfill({ json: [{ ...ceremonyState }] })
    })
    await page.route(`${SUPABASE_URL}/realtime/**`, route => route.abort())
  }

  test('cannot score without selecting lineup for individual scoring rounds', async ({ page }) => {
    const rounds = makeRounds()
    await installMock(page, rounds)
    await page.goto('/admin')

    // Petanque is live (3v3 individual scoring)
    await expect(page.getByText(/Pick 3 players per team/)).toBeVisible()

    // Try to score without selecting players
    const scorer = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorer.getByRole('button', { name: 'Stags' }).click()

    // Should show warning, not record score
    await expect(page.getByText(/Pick 3 players per team before scoring/)).toBeVisible()
    expect(teamScores.length).toBe(0)
  })

  test('double-clicking score button does not create duplicate scores', async ({ page }) => {
    // Use water balloon (simple round, no lineup needed)
    const rounds = makeRounds()
    rounds[1].status = 'upcoming'
    rounds[2].status = 'live'
    await installMock(page, rounds)
    await page.goto('/admin')

    await expect(page.getByText(/R3: Water Balloon Toss/)).toBeVisible()

    // Rapid double-click
    const scorer = page.locator('div').filter({ hasText: 'Who won?' }).last()
    const btn = scorer.getByRole('button', { name: 'Stags' })
    await btn.dblclick()

    // Wait for scoring to complete
    await expect(page.getByText(/Stags wins/)).toBeVisible()

    // Should only have 2 entries (1 win + 1 loss), not 4
    expect(teamScores.length).toBe(2)
  })

  test('scoring buttons disappear after simple round is scored', async ({ page }) => {
    const rounds = makeRounds()
    rounds[1].status = 'upcoming'
    rounds[2].status = 'live'
    await installMock(page, rounds)
    await page.goto('/admin')

    const scorer = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorer.getByRole('button', { name: 'Bucks' }).click()
    await expect(page.getByText(/Bucks wins/)).toBeVisible()

    // Score buttons should be gone
    await expect(page.getByText('Who won?')).not.toBeVisible()
  })

  test('scoring buttons disappear after all sub-matches scored', async ({ page }) => {
    const rounds = makeRounds()
    await installMock(page, rounds)
    await page.goto('/admin')

    // Petanque 3v3, best of 3 — different players each match
    const stagsLineups = [['Cam', 'Ricky', 'Adam'], ['Brandon', 'Ady', 'Seb'], ['Pedro', 'Marc', 'Simon']]
    const bucksLineups = [['Dom', 'Iggy', 'Bryan'], ['Ian', 'Grahame', 'Jonathan'], ['Diccon', 'Liam', null]]

    for (let match = 0; match < 3; match++) {
      for (const name of stagsLineups[match]) await page.locator('button').filter({ hasText: name }).first().click()
      for (const name of bucksLineups[match]) {
        if (name === null) {
          // Pick any available (not disabled) bucks player
          const availableBucks = page.locator('button:not([disabled])').filter({ hasText: /^Dom$/ })
          await availableBucks.first().click()
        } else {
          await page.locator('button').filter({ hasText: name }).first().click()
        }
      }

      const scorer = page.locator('div').filter({ hasText: 'Who won?' }).last()
      await scorer.getByRole('button', { name: 'Stags' }).click()
      await expect(page.getByText(new RegExp(`Stags wins match ${match + 1}`))).toBeVisible()
    }

    // After match 3, score buttons should be gone
    await expect(page.getByText('Who won?')).not.toBeVisible()
    expect(teamScores.length).toBe(6) // 3 matches x 2 teams
  })

  test('forfeit ceremony handles no forfeits gracefully', async ({ page }) => {
    const rounds = makeRounds()
    rounds[1].status = 'upcoming'
    rounds[2].status = 'live'
    await installMock(page, rounds)
    await page.goto('/')

    // Set ceremony to stag_spin with no forfeits available
    Object.assign(ceremonyState, { phase: 'stag_spin', winner_name: 'Stags', loser_name: 'Bucks' })
    await page.reload()

    await expect(page.getByRole('button', { name: /SPIN!/ })).toBeVisible()
    await page.getByRole('button', { name: /SPIN!/ }).click()

    // Should show fallback message instead of getting stuck
    await expect(page.getByText(/No forfeits left/)).toBeVisible()
  })
})
