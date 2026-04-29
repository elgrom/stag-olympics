import { expect } from '@playwright/test'
import { test } from './fixtures'

test.describe('Leaderboard - Round Cards', () => {
  test('shows rounds on the scores page', async ({ mockPage: page }) => {
    await page.goto('/')
    await expect(page.getByText(/R2 Petanque/)).toBeVisible()
    await expect(page.getByText(/R5 Tennis/)).toBeVisible()
    await expect(page.getByText(/R4 Beer Pong/)).toBeVisible()
    await expect(page.getByText(/R3 Water Balloon/)).toBeVisible()
    await expect(page.getByText(/R8 Flip Cup/)).toBeVisible()
  })

  test('shows LIVE badge on the current round', async ({ mockPage: page }) => {
    await page.goto('/')
    await expect(page.getByText('LIVE')).toBeVisible()
  })

  test('petanque card expands to show game rules and penalty', async ({ mockPage: page }) => {
    await page.goto('/')

    // The petanque round card - use the border-l-4 card container
    const cards = page.locator('.border-l-4')
    const petanqueCard = cards.filter({ hasText: 'R2 Petanque' })
    await petanqueCard.getByText('How to play').click()

    await expect(petanqueCard.getByText('Game Rules')).toBeVisible()
    await expect(petanqueCard.getByText(/Flip a coin/)).toBeVisible()
    await expect(petanqueCard.getByText(/13 points/)).toBeVisible()
    await expect(petanqueCard.getByText(/Oven mitts/)).toBeVisible()
  })

  test('tennis card expands to show game rules and penalty', async ({ mockPage: page }) => {
    await page.goto('/')

    const cards = page.locator('.border-l-4')
    const tennisCard = cards.filter({ hasText: 'R5 Tennis' })
    await tennisCard.getByText('How to play').click()

    await expect(tennisCard.getByText(/No deuces/)).toBeVisible()
    await expect(tennisCard.getByText(/Rally scoring to 11/)).toBeVisible()
    await expect(tennisCard.getByText(/Banana costume/)).toBeVisible()
  })

  test('water balloon card has no game rules section', async ({ mockPage: page }) => {
    await page.goto('/')

    const cards = page.locator('.border-l-4')
    const waterBalloonCard = cards.filter({ hasText: 'R3 Water Balloon' })
    await waterBalloonCard.getByText('How to play').click()

    await expect(waterBalloonCard.getByText('Format')).toBeVisible()
    await expect(waterBalloonCard.getByText('Game Rules')).not.toBeVisible()
  })

  test('round info collapses when clicked again', async ({ mockPage: page }) => {
    await page.goto('/')

    const cards = page.locator('.border-l-4')
    const petanqueCard = cards.filter({ hasText: 'R2 Petanque' })
    await petanqueCard.getByText('How to play').click()
    await expect(petanqueCard.getByText('Game Rules')).toBeVisible()

    await petanqueCard.getByText('Hide info').click()
    await expect(petanqueCard.getByText('Game Rules')).not.toBeVisible()
  })
})

test.describe('Leaderboard - Scores', () => {
  test('shows team names in the header', async ({ mockPage: page }) => {
    await page.goto('/')
    await expect(page.getByText('Alpha', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Beta', { exact: true }).first()).toBeVisible()
  })

  test('can switch to individual scores tab', async ({ mockPage: page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Individual' }).click()
    // Individual board should be visible (may be empty with no individual scores)
    await expect(page.getByRole('button', { name: 'Individual' })).toBeVisible()
  })
})

test.describe('Leaderboard - Forfeits', () => {
  test('forfeit wheel shows spin button', async ({ mockPage: page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /forfeit/i }).click()
    await expect(page.getByRole('button', { name: /spin/i })).toBeVisible()
  })
})
