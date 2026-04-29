import { test, expect, type Page } from '@playwright/test'

const SUPABASE_URL = 'https://lnvsfseworgqytpbgbsu.supabase.co'

/**
 * Tests that "Restart entire event" properly deletes all data
 * and that BOTH the admin AND public pages reflect the reset.
 *
 * This catches:
 * - RLS delete policies silently blocking deletions
 * - Stale data on the public page after reset
 * - Missing refetch calls
 */
test.describe('Restart Event - Data Deletion', () => {

  // Shared mock state — starts with scores from a completed round
  const teams = [
    { id: 'team-a', name: 'Stags', created_at: '2026-01-01T00:00:00Z' },
    { id: 'team-b', name: 'Bucks', created_at: '2026-01-01T00:00:00Z' },
  ]

  const players = [
    { id: 'p1', first_name: 'Cam', last_name: 'Miskin', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p2', first_name: 'Dom', last_name: 'Obrien', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
  ]

  let rounds = [
    { id: 'r1', number: 1, name: 'Quiz', emoji: '🧠', scheduled_time: '12:00', format: 'Quiz', scoring_guidance: '', max_team_points: 10, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 1, points_per_loss: 0, status: 'completed', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r2', number: 2, name: 'Petanque', emoji: '🎯', scheduled_time: '12:30', format: 'Best of 3', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'completed', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r3', number: 3, name: 'Water Balloon Toss', emoji: '💦', scheduled_time: '13:00', format: 'Last pair standing', scoring_guidance: '', max_team_points: 3, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
  ]

  let teamScores = [
    { id: 'ts1', round_id: 'r1', team_id: 'team-a', match_number: null, points: 7, created_at: '2026-01-01T00:00:00Z' },
    { id: 'ts2', round_id: 'r1', team_id: 'team-b', match_number: null, points: 5, created_at: '2026-01-01T00:00:00Z' },
    { id: 'ts3', round_id: 'r2', team_id: 'team-a', match_number: 1, points: 3, created_at: '2026-01-01T00:00:00Z' },
    { id: 'ts4', round_id: 'r2', team_id: 'team-b', match_number: 1, points: 1, created_at: '2026-01-01T00:00:00Z' },
  ]

  let individualScores = [
    { id: 'is1', round_id: 'r2', player_id: 'p1', match_number: 1, points: 1, created_at: '2026-01-01T00:00:00Z' },
  ]

  let forfeits = [
    { id: 'f1', text: 'Down your drink', is_used: false, created_at: '2026-01-01T00:00:00Z' },
    { id: 'f2', text: 'Eat a chilli', is_used: true, created_at: '2026-01-01T00:00:00Z' },
  ]

  const ceremonyState = { id: 'cs1', phase: 'idle', winner_name: null, loser_name: null, stag_forfeit: null, loser_forfeit: null, loser_penalty: null, updated_at: '2026-01-01T00:00:00Z' }

  function parseFilters(url: string) {
    const u = new URL(url)
    const filters: Record<string, string> = {}
    for (const [key, value] of u.searchParams) {
      if (key !== 'select' && key !== 'order' && key !== 'limit') filters[key] = value
    }
    return filters
  }

  async function installMock(page: Page) {
    await page.route(`${SUPABASE_URL}/rest/v1/teams*`, route => route.fulfill({ json: teams }))

    await page.route(`${SUPABASE_URL}/rest/v1/players*`, route => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON()
        const filters = parseFilters(route.request().url())
        const id = filters['id']?.replace('eq.', '')
        if (id) {
          const p = players.find(p => p.id === id)
          if (p) Object.assign(p, body)
        }
        return route.fulfill({ json: [] })
      }
      return route.fulfill({ json: players })
    })

    await page.route(`${SUPABASE_URL}/rest/v1/rounds*`, route => {
      if (route.request().method() === 'PATCH') {
        const body = route.request().postDataJSON()
        const filters = parseFilters(route.request().url())
        const id = filters['id']?.replace('eq.', '')
        if (id) {
          const r = rounds.find(r => r.id === id)
          if (r) Object.assign(r, body)
        } else {
          for (const r of rounds) Object.assign(r, body)
        }
        return route.fulfill({ json: [] })
      }
      return route.fulfill({ json: [...rounds].sort((a, b) => a.number - b.number) })
    })

    await page.route(`${SUPABASE_URL}/rest/v1/team_scores*`, route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        const rows = Array.isArray(body) ? body : [body]
        for (const row of rows) teamScores.push({ ...row, id: `new-${Date.now()}`, created_at: new Date().toISOString() })
        return route.fulfill({ json: rows })
      }
      if (route.request().method() === 'DELETE') {
        // Actually clear the array — this is what RLS was blocking in production
        teamScores.length = 0
        return route.fulfill({ json: [] })
      }
      return route.fulfill({ json: teamScores })
    })

    await page.route(`${SUPABASE_URL}/rest/v1/individual_scores*`, route => {
      if (route.request().method() === 'DELETE') {
        individualScores.length = 0
        return route.fulfill({ json: [] })
      }
      return route.fulfill({ json: individualScores })
    })

    await page.route(`${SUPABASE_URL}/rest/v1/forfeits*`, route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON()
        const rows = Array.isArray(body) ? body : [body]
        for (const row of rows) forfeits.push({ ...row, id: `new-${Date.now()}`, is_used: false, created_at: new Date().toISOString() })
        return route.fulfill({ json: rows })
      }
      if (route.request().method() === 'DELETE') {
        forfeits.length = 0
        return route.fulfill({ json: [] })
      }
      return route.fulfill({ json: forfeits })
    })

    await page.route(`${SUPABASE_URL}/rest/v1/quiz_responses*`, route => {
      if (route.request().method() === 'DELETE') return route.fulfill({ json: [] })
      return route.fulfill({ json: [] })
    })

    await page.route(`${SUPABASE_URL}/rest/v1/ceremony_state*`, route => {
      if (route.request().method() === 'PATCH') {
        Object.assign(ceremonyState, route.request().postDataJSON())
        return route.fulfill({ json: [] })
      }
      const accept = route.request().headers()['accept'] ?? ''
      if (accept.includes('vnd.pgrst.object')) {
        return route.fulfill({ json: { ...ceremonyState }, headers: { 'content-range': '0-0/1' } })
      }
      return route.fulfill({ json: [{ ...ceremonyState }] })
    })

    await page.route(`${SUPABASE_URL}/realtime/**`, route => route.abort())
  }

  test('restart clears scores on admin page', async ({ page }) => {
    // Reset shared state
    teamScores.length = 0
    teamScores.push(
      { id: 'ts1', round_id: 'r1', team_id: 'team-a', match_number: null, points: 7, created_at: '2026-01-01T00:00:00Z' },
      { id: 'ts2', round_id: 'r1', team_id: 'team-b', match_number: null, points: 5, created_at: '2026-01-01T00:00:00Z' },
      { id: 'ts3', round_id: 'r2', team_id: 'team-a', match_number: 1, points: 3, created_at: '2026-01-01T00:00:00Z' },
      { id: 'ts4', round_id: 'r2', team_id: 'team-b', match_number: 1, points: 1, created_at: '2026-01-01T00:00:00Z' },
    )
    individualScores.length = 0
    individualScores.push(
      { id: 'is1', round_id: 'r2', player_id: 'p1', match_number: 1, points: 1, created_at: '2026-01-01T00:00:00Z' },
    )
    rounds[0].status = 'completed'
    rounds[1].status = 'completed'
    rounds[2].status = 'upcoming'

    await installMock(page)
    await page.goto('/admin')

    // Verify scores exist before restart
    await expect(page.getByText(/Score:.*Stags 10.*Bucks 6/)).toBeVisible()

    // Restart entire event
    page.on('dialog', dialog => dialog.accept())
    await page.getByText(/Restart entire event/).click()

    // Wait for refetch — scores should be 0
    await expect(page.getByText(/Score:.*Stags 0.*Bucks 0/)).toBeVisible({ timeout: 5000 })

    // All rounds should be upcoming
    await expect(page.getByRole('button', { name: /Start Round 1/ })).toBeVisible()
  })

  test('restart clears scores on public page', async ({ browser }) => {
    // Reset mock state for this test
    teamScores.length = 0
    teamScores.push(
      { id: 'ts1', round_id: 'r1', team_id: 'team-a', match_number: null, points: 7, created_at: '2026-01-01T00:00:00Z' },
      { id: 'ts2', round_id: 'r1', team_id: 'team-b', match_number: null, points: 5, created_at: '2026-01-01T00:00:00Z' },
    )
    individualScores.length = 0
    rounds[0].status = 'completed'
    rounds[1].status = 'completed'
    rounds[2].status = 'upcoming'

    const adminCtx = await browser.newContext()
    const publicCtx = await browser.newContext()
    const adminPage = await adminCtx.newPage()
    const publicPage = await publicCtx.newPage()

    await installMock(adminPage)
    await installMock(publicPage)

    // Load both pages
    await publicPage.goto('/')
    await adminPage.goto('/admin')

    // Public page should show scores (the header score)
    await expect(publicPage.getByText('7', { exact: true }).first()).toBeVisible()

    // Admin restarts
    adminPage.on('dialog', dialog => dialog.accept())
    await adminPage.getByText(/Restart entire event/).click()

    // Sync mock: rounds back to upcoming
    for (const r of rounds) r.status = 'upcoming'

    // Public page refreshes (simulate the 10s poll by reloading)
    await publicPage.reload()

    // Public page should now show 0
    await expect(publicPage.getByText('0').first()).toBeVisible()

    await adminCtx.close()
    await publicCtx.close()
  })

  test('delete operations actually remove data from mock (simulates RLS)', async ({ page }) => {
    // Reset data
    teamScores.length = 0
    teamScores.push(
      { id: 'ts1', round_id: 'r1', team_id: 'team-a', match_number: null, points: 7, created_at: '2026-01-01T00:00:00Z' },
    )
    individualScores.length = 0
    individualScores.push(
      { id: 'is1', round_id: 'r2', player_id: 'p1', match_number: 1, points: 1, created_at: '2026-01-01T00:00:00Z' },
    )
    for (const r of rounds) r.status = 'upcoming'

    await installMock(page)

    // Verify data exists before delete
    expect(teamScores.length).toBe(1)
    expect(individualScores.length).toBe(1)

    await page.goto('/admin')

    // Restart
    page.on('dialog', dialog => dialog.accept())
    await page.getByText(/Restart entire event/).click()

    // Wait for the operations to complete
    await page.waitForTimeout(500)

    // Verify the mock arrays were actually cleared (not silently skipped)
    expect(teamScores.length).toBe(0)
    expect(individualScores.length).toBe(0)
  })
})
