import { test, expect } from '@playwright/test'
import { createStatefulMock } from './stateful-mock'

/**
 * Full event playthrough: Quiz → Petanque → Water Balloon → Beer Pong →
 * Tennis → Taskmaster → Dizzy Bat → Flip Cup.
 *
 * Tests the entire admin flow as it would happen on the day:
 * start rounds, score matches, pick lineups, check leaderboard,
 * spin forfeit wheel, and verify final results.
 */
test.describe('Full Event Playthrough', () => {
  let mock: ReturnType<typeof createStatefulMock>

  test('complete event from quiz to flip cup finale', async ({ page }) => {
    mock = createStatefulMock()
    await mock.install(page)

    // ──────────────────────────────────────────────
    // PHASE 1: Start the event — all rounds upcoming
    // ──────────────────────────────────────────────
    await page.goto('/admin')
    await expect(page.getByText('Admin Panel')).toBeVisible()
    await expect(page.getByRole('button', { name: /Start Round 1.*Diccon/ })).toBeVisible()

    // ──────────────────────────────────────────────
    // ROUND 1: Quiz
    // ──────────────────────────────────────────────
    await page.getByRole('button', { name: /Start Round 1/ }).click()
    mock.rounds[0].status = 'live'
    await page.goto('/admin')

    await expect(page.getByText(/LIVE.*R1/)).toBeVisible()
    // QuizAdmin shows instead of RoundScorer for round 1
    await expect(page.getByText('Quiz Master Controls')).toBeVisible()
    await expect(page.getByRole('button', { name: /Start Quiz.*Question 1/ })).toBeVisible()

    // Start the quiz
    await page.getByRole('button', { name: /Start Quiz/ }).click()
    await expect(page.getByText(/Question 1 of 10/)).toBeVisible()

    // Reveal answer
    await page.getByRole('button', { name: /Reveal Answer/ }).click()

    // Go to next question
    await page.getByRole('button', { name: /Next Question/ }).click()
    await expect(page.getByText(/Question 2 of 10/)).toBeVisible()

    // Fast-forward through remaining questions
    for (let q = 2; q <= 9; q++) {
      await page.getByRole('button', { name: /Reveal Answer/ }).click()
      await page.getByRole('button', { name: /Next Question/ }).click()
    }

    // Question 10 - reveal and finish
    await expect(page.getByText(/Question 10 of 10/)).toBeVisible()
    await page.getByRole('button', { name: /Reveal Answer/ }).click()
    await page.getByRole('button', { name: /Finish Quiz/ }).click()
    await expect(page.getByText(/Quiz complete/)).toBeVisible()

    // End quiz round
    mock.rounds[0].status = 'completed'
    await page.goto('/admin')

    // ──────────────────────────────────────────────
    // Check leaderboard after Round 1
    // ──────────────────────────────────────────────
    await page.goto('/')
    await expect(page.getByText('Stags')).toBeVisible()
    await expect(page.getByText('Bucks')).toBeVisible()

    // ──────────────────────────────────────────────
    // ROUND 2: Petanque (Best of 3, 3v3, individual scoring)
    // ──────────────────────────────────────────────
    await page.goto('/admin')
    await page.getByRole('button', { name: /Start Round 2.*Petanque/ }).click()
    mock.rounds[1].status = 'live'
    await page.goto('/admin')

    await expect(page.getByText(/LIVE.*R2/)).toBeVisible()
    await expect(page.getByText(/R2: Petanque/)).toBeVisible()
    await expect(page.getByText(/Match 1 of 3/)).toBeVisible()
    await expect(page.getByText(/Pick 3 players per team/)).toBeVisible()

    // Check rules are accessible
    await page.getByText('Rules, kit & drinking').click()
    await expect(page.getByText('Game Rules')).toBeVisible()
    await expect(page.getByText(/Flip a coin/)).toBeVisible()
    await expect(page.getByText(/Oven mitts/)).toBeVisible()
    await expect(page.getByText(/Winner spins the wheel/)).toBeVisible()
    await page.getByText('Hide details').click()

    // Pick lineup for match 1
    await page.locator('button').filter({ hasText: 'Cam' }).first().click()
    await page.locator('button').filter({ hasText: 'Ricky' }).first().click()
    await page.locator('button').filter({ hasText: 'Adam' }).first().click()
    await page.locator('button').filter({ hasText: /^Dom$/ }).first().click()
    await page.locator('button').filter({ hasText: 'Iggy' }).first().click()
    await page.locator('button').filter({ hasText: 'Bryan' }).first().click()

    // Score match 1: Stags win
    const scorer = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorer.getByRole('button', { name: 'Stags' }).click()
    await expect(page.getByText(/Stags wins match 1.*\+3 pts/)).toBeVisible()

    // Match 2
    await expect(page.getByText(/Match 2 of 3/)).toBeVisible()

    await page.locator('button').filter({ hasText: 'Brandon' }).first().click()
    await page.locator('button').filter({ hasText: 'Ady' }).first().click()
    await page.locator('button').filter({ hasText: 'Seb' }).first().click()
    await page.locator('button').filter({ hasText: 'Ian' }).first().click()
    await page.locator('button').filter({ hasText: 'Grahame' }).first().click()
    await page.locator('button').filter({ hasText: 'Jonathan' }).first().click()

    // Score match 2: Bucks win
    const scorer2 = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorer2.getByRole('button', { name: 'Bucks' }).click()
    await expect(page.getByText(/Bucks wins match 2.*\+3 pts/)).toBeVisible()

    // Match 3
    await expect(page.getByText(/Match 3 of 3/)).toBeVisible()

    // Check used player indicators
    await expect(page.locator('button').filter({ hasText: /Cam.*✓/ })).toBeVisible()

    // Pick remaining players
    await page.locator('button').filter({ hasText: 'Pedro' }).first().click()
    await page.locator('button').filter({ hasText: 'Marc' }).first().click()
    await page.locator('button').filter({ hasText: 'Simon' }).first().click()

    // Score match 3: Stags win (2-1 series)
    const scorer3 = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorer3.getByRole('button', { name: 'Stags' }).click()
    await expect(page.getByText(/Stags wins match 3.*\+3 pts/)).toBeVisible()

    // FORFEIT CEREMONY (sub-match round — manual trigger)
    await expect(page.getByRole('button', { name: /Start Forfeit Ceremony/ })).toBeVisible()
    await page.getByRole('button', { name: /Start Forfeit Ceremony/ }).click()

    // Step 1: Spin for Diccon
    await expect(page.getByText('Forfeit Ceremony')).toBeVisible()
    await expect(page.getByText(/Spin for Diccon/)).toBeVisible()
    await page.getByRole('button', { name: /Spin the Wheel for Diccon/ }).click()
    await expect(page.getByText(/Diccon must do:/)).toBeVisible()

    // Move to losing team step
    await page.getByRole('button', { name: /Next.*Losing Team/ }).click()

    // Step 2: Losing team (Bucks) chooses — pick forfeit
    await expect(page.getByText(/Bucks.*forfeit or penalty/)).toBeVisible()
    await page.getByRole('button', { name: /Spin a Forfeit/ }).click()
    await page.getByRole('button', { name: /Spin the Wheel/ }).click()
    await expect(page.getByText(/Bucks must do:/)).toBeVisible()
    await page.getByRole('button', { name: /Done/ }).click()
    await expect(page.getByText(/Forfeit ceremony complete/)).toBeVisible()

    mock.rounds[1].status = 'completed'
    await page.goto('/admin')

    // ──────────────────────────────────────────────
    // ROUND 3: Water Balloon Toss (simple win/loss)
    // ──────────────────────────────────────────────
    await page.getByRole('button', { name: /Start Round 3.*Water Balloon/ }).click()
    mock.rounds[2].status = 'live'
    await page.goto('/admin')

    await expect(page.getByText(/R3: Water Balloon Toss/)).toBeVisible()
    await expect(page.getByText(/Pick.*players per team/)).not.toBeVisible()

    const scorerWB = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorerWB.getByRole('button', { name: 'Bucks' }).click()
    await expect(page.getByText(/Bucks wins.*\+3 pts/)).toBeVisible()

    // FORFEIT CEREMONY (simple round — auto-triggered)
    await expect(page.getByText('Forfeit Ceremony')).toBeVisible()
    await page.getByRole('button', { name: /Spin the Wheel for Diccon/ }).click()
    await expect(page.getByText(/Diccon must do:/)).toBeVisible()
    await page.getByRole('button', { name: /Next.*Losing Team/ }).click()

    // Losing team (Stags) takes the penalty this time
    await expect(page.getByText(/Stags.*forfeit or penalty/)).toBeVisible()
    await page.getByRole('button', { name: /Take Penalty/ }).click()
    // Penalty for R4 is "Left handed"
    await expect(page.getByText(/Left handed/)).toBeVisible()
    await page.getByRole('button', { name: /Done/ }).click()
    await expect(page.getByText(/Forfeit ceremony complete/)).toBeVisible()

    mock.rounds[2].status = 'completed'
    await page.goto('/admin')

    // ──────────────────────────────────────────────
    // ROUND 4: Beer Pong (Best of 3, 2v2)
    // ──────────────────────────────────────────────
    await page.getByRole('button', { name: /Start Round 4.*Beer Pong/ }).click()
    mock.rounds[3].status = 'live'
    await page.goto('/admin')

    await expect(page.getByText(/Match 1 of 3/)).toBeVisible()
    await expect(page.getByText(/Pick 2 players per team/)).toBeVisible()

    // Match 1
    await page.locator('button').filter({ hasText: 'Cam' }).first().click()
    await page.locator('button').filter({ hasText: 'Ricky' }).first().click()
    await page.locator('button').filter({ hasText: /^Dom$/ }).first().click()
    await page.locator('button').filter({ hasText: 'Iggy' }).first().click()

    const scorerBP = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorerBP.getByRole('button', { name: 'Stags' }).click()
    await expect(page.getByText(/Stags wins match 1/)).toBeVisible()

    // Match 2
    await page.locator('button').filter({ hasText: 'Brandon' }).first().click()
    await page.locator('button').filter({ hasText: 'Adam' }).first().click()
    await page.locator('button').filter({ hasText: 'Bryan' }).first().click()
    await page.locator('button').filter({ hasText: 'Ian' }).first().click()

    const scorerBP2 = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorerBP2.getByRole('button', { name: 'Stags' }).click()
    await expect(page.getByText(/Stags wins match 2/)).toBeVisible()

    mock.rounds[3].status = 'completed'
    await page.goto('/admin')

    // ──────────────────────────────────────────────
    // ROUND 5: Tennis (Best of 3, 2v2)
    // ──────────────────────────────────────────────
    await page.getByRole('button', { name: /Start Round 5.*Tennis/ }).click()
    mock.rounds[4].status = 'live'
    await page.goto('/admin')

    await expect(page.getByText(/R5: Tennis/)).toBeVisible()

    // Check tennis rules
    await page.getByText('Rules, kit & drinking').click()
    await expect(page.getByText(/No deuces/)).toBeVisible()
    await expect(page.getByText(/Banana costume/)).toBeVisible()
    await page.getByText('Hide details').click()

    // Match 1: Stags
    await page.locator('button').filter({ hasText: 'Cam' }).first().click()
    await page.locator('button').filter({ hasText: 'Ricky' }).first().click()
    await page.locator('button').filter({ hasText: /^Dom$/ }).first().click()
    await page.locator('button').filter({ hasText: 'Iggy' }).first().click()

    const scorerT1 = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorerT1.getByRole('button', { name: 'Stags' }).click()

    // Match 2: Bucks
    await page.locator('button').filter({ hasText: 'Adam' }).first().click()
    await page.locator('button').filter({ hasText: 'Brandon' }).first().click()
    await page.locator('button').filter({ hasText: 'Bryan' }).first().click()
    await page.locator('button').filter({ hasText: 'Ian' }).first().click()

    const scorerT2 = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorerT2.getByRole('button', { name: 'Bucks' }).click()

    // Match 3: Bucks (wins 2-1)
    await page.locator('button').filter({ hasText: 'Ady' }).first().click()
    await page.locator('button').filter({ hasText: 'Seb' }).first().click()
    await page.locator('button').filter({ hasText: 'Grahame' }).first().click()
    await page.locator('button').filter({ hasText: 'Jonathan' }).first().click()

    const scorerT3 = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorerT3.getByRole('button', { name: 'Bucks' }).click()
    await expect(page.getByText(/Bucks wins match 3/)).toBeVisible()

    mock.rounds[4].status = 'completed'
    await page.goto('/admin')

    // ──────────────────────────────────────────────
    // ROUND 6: Taskmaster (5/2 pts)
    // ──────────────────────────────────────────────
    await page.getByRole('button', { name: /Start Round 6.*Taskmaster/ }).click()
    mock.rounds[5].status = 'live'
    await page.goto('/admin')

    await expect(page.getByText(/R6: Taskmaster/)).toBeVisible()
    const scorerTM = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorerTM.getByRole('button', { name: 'Stags' }).click()
    await expect(page.getByText(/Stags wins.*\+5 pts/)).toBeVisible()

    mock.rounds[5].status = 'completed'
    await page.goto('/admin')

    // ──────────────────────────────────────────────
    // ROUND 7: Dizzy Bat Relay
    // ──────────────────────────────────────────────
    await page.getByRole('button', { name: /Start Round 7.*Dizzy Bat/ }).click()
    mock.rounds[6].status = 'live'
    await page.goto('/admin')

    await expect(page.getByText(/R7: Dizzy Bat Relay/)).toBeVisible()
    const scorerDB = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorerDB.getByRole('button', { name: 'Bucks' }).click()
    await expect(page.getByText(/Bucks wins.*\+3 pts/)).toBeVisible()

    mock.rounds[6].status = 'completed'
    await page.goto('/admin')

    // ──────────────────────────────────────────────
    // ROUND 8: Flip Cup Finale (5/2 pts)
    // ──────────────────────────────────────────────
    await page.getByRole('button', { name: /Start Round 8.*Flip Cup/ }).click()
    mock.rounds[7].status = 'live'
    await page.goto('/admin')

    await expect(page.getByText(/R8: Flip Cup Finale/)).toBeVisible()
    const scorerFC = page.locator('div').filter({ hasText: 'Who won?' }).last()
    await scorerFC.getByRole('button', { name: 'Stags' }).click()
    await expect(page.getByText(/Stags wins.*\+5 pts/)).toBeVisible()

    mock.rounds[7].status = 'completed'

    // ──────────────────────────────────────────────
    // FINAL: All rounds complete
    // ──────────────────────────────────────────────
    await page.goto('/admin')
    await expect(page.getByText(/All rounds complete/)).toBeVisible()

    // ──────────────────────────────────────────────
    // Verify public leaderboard
    // ──────────────────────────────────────────────
    await page.goto('/')
    // Use exact match + first() since team names appear multiple times (header + round winners)
    await expect(page.getByText('Stags', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Bucks', { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/R2 Petanque/)).toBeVisible()
    await expect(page.getByText(/R5 Tennis/)).toBeVisible()
    await expect(page.getByText(/R8 Flip Cup/)).toBeVisible()

    // ──────────────────────────────────────────────
    // Forfeit wheel still functional
    // ──────────────────────────────────────────────
    await page.getByRole('button', { name: /forfeit/i }).click()
    await expect(page.getByRole('button', { name: /Spin/i })).toBeVisible()
  })

  test('restart entire event resets everything', async ({ page }) => {
    mock = createStatefulMock()
    mock.rounds[0].status = 'completed'
    mock.rounds[1].status = 'live'
    mock.teamScores.push(
      { id: 'ts1', round_id: 'r1', team_id: 'team-a', match_number: null, points: 7, created_at: '2026-01-01T00:00:00Z' },
      { id: 'ts2', round_id: 'r1', team_id: 'team-b', match_number: null, points: 5, created_at: '2026-01-01T00:00:00Z' },
    )

    await mock.install(page)
    await page.goto('/admin')
    await expect(page.getByText(/LIVE.*R2/)).toBeVisible()

    // Handle both confirm dialogs
    page.on('dialog', dialog => dialog.accept())
    await page.getByText(/Restart entire event/).click()

    // Sync mock state
    for (const r of mock.rounds) r.status = 'upcoming'
    mock.teamScores.length = 0
    mock.individualScores.length = 0

    await page.goto('/admin')
    await expect(page.getByRole('button', { name: /Start Round 1/ })).toBeVisible()
  })
})
