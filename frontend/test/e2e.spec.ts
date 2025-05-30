import { test, expect } from '@playwright/test'

test('can create game and make first move', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /create game/i }).click()
  await page.locator('.board .sq').nth(8).click()   // select pawn
  await page.locator('.board .sq').nth(16).click()  // commit
  await page.getByRole('button', { name: /reveal/i }).click()
  await expect(page.locator('.board .sq').nth(16)).toHaveText(/♙|♟/)
})