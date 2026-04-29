import { test, expect, type Page } from '@playwright/test'

const SUPABASE_URL = 'https://lnvsfseworgqytpbgbsu.supabase.co'

/**
 * Two-screen forfeit ceremony test.
 *
 * Simulates the real-world setup: admin on one device, public screen on another.
 * Both share the same Supabase mock state, so writes from admin are visible to
 * the public screen on its next poll/fetch.
 */
test.describe('Two-Screen Forfeit Ceremony', () => {

  // Shared state between both pages — simulates the database
  const sharedCeremony = {
    id: 'cs1', phase: 'idle' as string,
    winner_name: null as string | null, loser_name: null as string | null,
    stag_forfeit: null as string | null, loser_forfeit: null as string | null,
    loser_penalty: null as string | null, updated_at: '2026-01-01T00:00:00Z',
  }

  const sharedForfeits = [
    { id: 'f1', text: 'Down your drink', is_used: false, created_at: '2026-01-01T00:00:00Z' },
    { id: 'f2', text: 'Eat a chilli', is_used: false, created_at: '2026-01-01T00:00:00Z' },
    { id: 'f3', text: 'Shoey', is_used: false, created_at: '2026-01-01T00:00:00Z' },
    { id: 'f4', text: 'Cinnamon challenge', is_used: false, created_at: '2026-01-01T00:00:00Z' },
  ]

  const teams = [
    { id: 'team-a', name: 'Stags', created_at: '2026-01-01T00:00:00Z' },
    { id: 'team-b', name: 'Bucks', created_at: '2026-01-01T00:00:00Z' },
  ]

  const players = [
    { id: 'p1', first_name: 'Cam', last_name: 'Miskin', nickname: null, team_id: 'team-a', created_at: '2026-01-01T00:00:00Z' },
    { id: 'p2', first_name: 'Dom', last_name: 'Obrien', nickname: null, team_id: 'team-b', created_at: '2026-01-01T00:00:00Z' },
  ]

  // Round 3 is live (simple round — no sub-matches, no lineups)
  const rounds = [
    { id: 'r1', number: 1, name: 'Quiz', emoji: '🧠', scheduled_time: '12:00', format: 'Quiz', scoring_guidance: '', max_team_points: 10, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 1, points_per_loss: 0, status: 'completed', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r2', number: 2, name: 'Petanque', emoji: '🎯', scheduled_time: '12:30', format: 'Best of 3', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'completed', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r3', number: 3, name: 'Water Balloon Toss', emoji: '💦', scheduled_time: '13:00', format: 'Last pair standing', scoring_guidance: '', max_team_points: 3, has_individual_scoring: false, has_sub_matches: false, sub_match_count: null, points_per_win: 3, points_per_loss: 1, status: 'live', created_at: '2026-01-01T00:00:00Z' },
    { id: 'r4', number: 4, name: 'Beer Pong', emoji: '🍺', scheduled_time: '13:30', format: 'Best of 3', scoring_guidance: '', max_team_points: 9, has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3, points_per_win: 3, points_per_loss: 1, status: 'upcoming', created_at: '2026-01-01T00:00:00Z' },
  ]

  async function installMock(page: Page) {
    await page.route(`${SUPABASE_URL}/rest/v1/teams*`, route => route.fulfill({ json: teams }))
    await page.route(`${SUPABASE_URL}/rest/v1/players*`, route => route.fulfill({ json: players }))
    await page.route(`${SUPABASE_URL}/rest/v1/rounds*`, route => {
      const sorted = [...rounds].sort((a, b) => a.number - b.number)
      return route.fulfill({ json: sorted })
    })
    await page.route(`${SUPABASE_URL}/rest/v1/team_scores*`, route => {
      if (route.request().method() === 'POST') return route.fulfill({ json: [] })
      return route.fulfill({ json: [] })
    })
    await page.route(`${SUPABASE_URL}/rest/v1/individual_scores*`, route => route.fulfill({ json: [] }))
    await page.route(`${SUPABASE_URL}/rest/v1/quiz_responses*`, route => route.fulfill({ json: [] }))

    // Shared forfeits — both pages read/write the same array
    await page.route(`${SUPABASE_URL}/rest/v1/forfeits*`, route => {
      if (route.request().method() === 'PATCH') {
        const url = route.request().url()
        const idMatch = url.match(/id=eq\.([^&]+)/)
        if (idMatch) {
          const f = sharedForfeits.find(f => f.id === idMatch[1])
          if (f) Object.assign(f, route.request().postDataJSON())
        }
        return route.fulfill({ json: [] })
      }
      return route.fulfill({ json: sharedForfeits })
    })

    // Shared ceremony state — both pages read/write the same object
    await page.route(`${SUPABASE_URL}/rest/v1/ceremony_state*`, route => {
      if (route.request().method() === 'PATCH') {
        Object.assign(sharedCeremony, route.request().postDataJSON())
        return route.fulfill({ json: [] })
      }
      const accept = route.request().headers()['accept'] ?? ''
      if (accept.includes('vnd.pgrst.object')) {
        return route.fulfill({ json: { ...sharedCeremony }, headers: { 'content-range': '0-0/1' } })
      }
      return route.fulfill({ json: [{ ...sharedCeremony }] })
    })

    await page.route(`${SUPABASE_URL}/realtime/**`, route => route.abort())
  }

  test('admin starts ceremony, public screen shows spin, winner taps it', async ({ browser }) => {
    // Create two separate browser contexts (like two devices)
    const adminContext = await browser.newContext()
    const publicContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const publicPage = await publicContext.newPage()

    // Install shared mock on both pages
    await installMock(adminPage)
    await installMock(publicPage)

    // Load both pages
    await adminPage.goto('/admin')
    await publicPage.goto('/')

    // Verify admin sees the live round scorer
    await expect(adminPage.getByText(/R3: Water Balloon Toss/)).toBeVisible()

    // Verify public screen shows the leaderboard (no overlay)
    await expect(publicPage.getByText('Stag Olympics')).toBeVisible()
    await expect(publicPage.locator('.fixed.inset-0')).not.toBeVisible()

    // ── ADMIN: Score the round (Stags win) ──
    const scorer = adminPage.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorer.getByRole('button', { name: 'Stags' }).click()
    await expect(adminPage.getByText(/Stags wins/)).toBeVisible()

    // ── ADMIN: Start forfeit ceremony ──
    await adminPage.getByRole('button', { name: /Start Forfeit Ceremony/ }).click()
    await expect(adminPage.getByText(/Waiting for someone to spin/)).toBeVisible()

    // ── PUBLIC: Overlay appears with SPIN button ──
    // Poll until the public screen picks up the ceremony state
    await publicPage.reload()
    await expect(publicPage.getByText('Forfeit Ceremony')).toBeVisible({ timeout: 5000 })
    await expect(publicPage.getByText(/Stags won.*Bucks lost/)).toBeVisible()
    await expect(publicPage.getByRole('button', { name: /SPIN!/ })).toBeVisible()

    // ── PUBLIC: Winner taps SPIN ──
    await publicPage.getByRole('button', { name: /SPIN!/ }).click()

    // Should show spinning animation
    await expect(publicPage.getByText(/Spinning for Diccon/)).toBeVisible()

    // Wait for result (2s delay)
    await expect(publicPage.getByText(/Diccon must do:/)).toBeVisible({ timeout: 5000 })

    // Verify a forfeit was selected
    const stagForfeit = await publicPage.locator('text=Diccon must do:').locator('..').locator('.text-yellow-400').textContent()
    expect(stagForfeit).toBeTruthy()

    // ── ADMIN: Sees the result reflected, advances to losing team ──
    // Admin needs to reload to see the updated ceremony state
    await adminPage.reload()
    // Admin should still see ceremony controls
    await expect(adminPage.getByText('Forfeit Ceremony')).toBeVisible()

    // Advance to losing team choice
    await adminPage.getByRole('button', { name: /Skip.*Losing Team/ }).click()

    // ── PUBLIC: Shows loser choice with SPIN button ──
    await publicPage.reload()
    await expect(publicPage.getByText(/Bucks.*forfeit or penalty/)).toBeVisible({ timeout: 5000 })
    await expect(publicPage.getByRole('button', { name: /SPIN A FORFEIT/ })).toBeVisible()

    // ── PUBLIC: Loser taps SPIN ──
    await publicPage.getByRole('button', { name: /SPIN A FORFEIT/ }).click()
    await expect(publicPage.getByText(/Spinning for Bucks/)).toBeVisible()
    await expect(publicPage.getByText(/Bucks must do:/)).toBeVisible({ timeout: 5000 })

    // Verify a forfeit was selected for the loser
    const loserForfeit = await publicPage.locator('text=Bucks must do:').locator('..').locator('.text-red-400').textContent()
    expect(loserForfeit).toBeTruthy()

    // Verify two different forfeits were used
    const usedCount = sharedForfeits.filter(f => f.is_used).length
    expect(usedCount).toBe(2)

    // ── ADMIN: Done & dismiss ──
    await adminPage.reload()
    // Ceremony is in loser_forfeit phase which shows "done" controls
    await expect(adminPage.getByText(/Forfeit ceremony complete/)).toBeVisible()
    await adminPage.getByRole('button', { name: /Dismiss/ }).click()

    // Clean up
    await adminContext.close()
    await publicContext.close()
  })

  test('admin assigns penalty instead of forfeit spin', async ({ browser }) => {
    // Reset shared state
    Object.assign(sharedCeremony, { phase: 'idle', winner_name: null, loser_name: null, stag_forfeit: null, loser_forfeit: null, loser_penalty: null })
    sharedForfeits.forEach(f => f.is_used = false)

    const adminContext = await browser.newContext()
    const publicContext = await browser.newContext()
    const adminPage = await adminContext.newPage()
    const publicPage = await publicContext.newPage()

    await installMock(adminPage)
    await installMock(publicPage)

    await adminPage.goto('/admin')
    await publicPage.goto('/')

    // Score and start ceremony
    const scorer = adminPage.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorer.getByRole('button', { name: 'Bucks' }).click()
    await adminPage.getByRole('button', { name: /Start Forfeit Ceremony/ }).click()

    // Public screen shows spin button
    await publicPage.reload()
    await expect(publicPage.getByRole('button', { name: /SPIN!/ })).toBeVisible({ timeout: 5000 })

    // Admin skips stag spin and goes to loser
    await adminPage.getByRole('button', { name: /Skip.*Losing Team/ }).click()

    // Admin assigns penalty instead of letting loser spin
    await adminPage.getByRole('button', { name: /Assign Penalty/ }).click()

    // Public screen shows penalty
    await publicPage.reload()
    await expect(publicPage.getByText(/Stags takes the penalty/)).toBeVisible({ timeout: 5000 })
    // R4 penalty is "Left handed"
    await expect(publicPage.getByText(/Left handed/)).toBeVisible()

    // Admin dismisses (loser_penalty maps to done phase directly)
    await adminPage.reload()
    await expect(adminPage.getByText(/Forfeit ceremony complete/)).toBeVisible()
    await adminPage.getByRole('button', { name: /Dismiss/ }).click()

    // Public screen overlay disappears
    await publicPage.reload()
    await expect(publicPage.locator('.fixed.inset-0')).not.toBeVisible()

    await adminContext.close()
    await publicContext.close()
  })
})
