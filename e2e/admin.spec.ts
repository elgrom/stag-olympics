import { expect } from '@playwright/test'
import { test } from './fixtures'

test.describe('Admin Panel', () => {
  test('loads and shows admin heading', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await expect(page.getByText('Admin Panel')).toBeVisible()
    await expect(page.getByText(/Score:/)).toBeVisible()
  })

  test('shows round control with live round', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await expect(page.getByText('Round Control')).toBeVisible()
    await expect(page.getByText(/LIVE.*R2/)).toBeVisible()
  })

  test('shows petanque scorer with expandable rules', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await expect(page.getByText(/R2: Petanque/)).toBeVisible()

    await page.getByText('Rules, kit & drinking').click()

    await expect(page.getByText('Format')).toBeVisible()
    await expect(page.getByText('Game Rules')).toBeVisible()
    await expect(page.getByText(/Flip a coin/)).toBeVisible()
    await expect(page.getByText('Kit needed')).toBeVisible()
    await expect(page.getByText('Drinking rule')).toBeVisible()
  })

  test('shows penalty info in admin rules panel', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await page.getByText('Rules, kit & drinking').click()

    await expect(page.getByText(/Penalty.*loser skips forfeit/)).toBeVisible()
    await expect(page.getByText(/Oven mitts/)).toBeVisible()
  })

  test('shows end-of-round forfeit flow in admin', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await page.getByText('Rules, kit & drinking').click()

    await expect(page.getByText(/Winner spins the wheel/)).toBeVisible()
    await expect(page.getByText(/Diccon does the forfeit/)).toBeVisible()
    await expect(page.getByText(/Losing team picks someone/)).toBeVisible()
  })

  test('shows player lineup picker for petanque', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await expect(page.getByText(/Pick 3 players per team/)).toBeVisible()
  })

  test('shows who won scoring buttons', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await expect(page.getByText('Who won?')).toBeVisible()
  })

  test('restart entire event button exists', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await expect(page.getByText(/Restart entire event/)).toBeVisible()
  })

  test('team draft section is visible with players', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await expect(page.getByText('Team Draft')).toBeVisible()
    await expect(page.getByText(/Cam Miskin/)).toBeVisible()
  })

  test('forfeits section shows count', async ({ mockPage: page }) => {
    await page.goto('/admin')
    await expect(page.getByText(/Forfeits \(5\)/)).toBeVisible()
  })
})
