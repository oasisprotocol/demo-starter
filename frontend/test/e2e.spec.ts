import { test, expect } from '@playwright/test'

test('can create game and make first move', async ({ page }) => {
  await page.goto('/')

  // Note: This test assumes wallet is connected and auto-signing is enabled
  // In a real test environment, you would mock the wallet or use a test wallet

  await page.getByRole('button', { name: /create game/i }).click()

  // Wait for game creation transaction
  await page.waitForTimeout(2000)

  // Make first move - select piece
  await page.locator('.board .sq').nth(8).click() // select pawn at a2

  // Complete the move - this triggers commit transaction
  await page.locator('.board .sq').nth(16).click() // move to a3

  // Wait for commit transaction and reveal button to appear
  await expect(page.getByRole('button', { name: /reveal move/i })).toBeVisible({ timeout: 10000 })

  // Click reveal to send second transaction
  await page.getByRole('button', { name: /reveal move/i }).click()

  // Wait for reveal transaction and board update - check for piece icon
  await expect(page.locator('.board .sq').nth(16).locator('.piece-icon')).toBeVisible({ timeout: 10000 })
  
  // Verify the piece icon is a white pawn
  const pieceIcon = await page.locator('.board .sq').nth(16).locator('.piece-icon').getAttribute('src')
  expect(pieceIcon).toContain('white-pawn')
})
