import { BrowserContext, expect, test as baseTest } from '@playwright/test'
import dappwright, { Dappwright, MetaMaskWallet } from '@tenkeylabs/dappwright'

export const test = baseTest.extend<{
  context: BrowserContext
  wallet: Dappwright
}>({
  context: async ({}, use) => {
    // Launch context with extension
    const [wallet, _, context] = await dappwright.bootstrap('', {
      wallet: 'metamask',
      version: MetaMaskWallet.recommendedVersion,
      seed: 'test test test test test test test test test test test junk', // Hardhat's default
      headless: false, // Set to true for CI, false for local debugging
    })

    // Add Sapphire Localnet as a custom network
    await wallet.addNetwork({
      networkName: 'Sapphire Localnet',
      rpc: 'http://localhost:8545',
      chainId: 23293, // 0x5afd
      symbol: 'ROSE',
    })

    await use(context)
  },

  wallet: async ({ context }, use) => {
    const metamask = await dappwright.getWallet('metamask', context)
    await use(metamask)
  },
})

test.beforeEach(async ({ page }) => {
  await page.goto('/') // Using baseURL from playwright.config.ts
})

test('set and view time capsule message', async ({ wallet, page }) => {
  // Connect wallet
  await page.getByTestId('rk-connect-button').click()
  await page.getByTestId('rk-wallet-option-injected-sapphire').click()
  await wallet.approve()
  await expect(page.getByText('Time Capsule DApp')).toBeVisible() // Wait for page to settle after connection

  const messageText = 'My secret time capsule message!'
  const revealDurationSeconds = '5' // Set a short duration for testing

  // Locate input for the message (distinguish from duration input)
  // Assuming the message input is the first one with a label containing "Your Message"
  const messageInput = page.locator('input[id^="headlessui-"][placeholder=" "]').first()
  await messageInput.fill(messageText)
  
  // Locate input for the duration
  const durationInput = page.locator('input[id^="headlessui-"][placeholder=" "]').nth(1)
  await durationInput.fill(revealDurationSeconds)

  const setCapsuleButton = page.getByRole('button', { name: 'Set Capsule Message' })
  await setCapsuleButton.click()
  await wallet.confirmTransaction()

  // Wait for transaction to be processed and UI to update
  await expect(setCapsuleButton).toBeEnabled({ timeout: 15000 }) // Increased timeout for block mining

  // Check locked state first
  const revealInputMask = page.locator('[data-label*="Locked. Reveals at:"]')
  await expect(revealInputMask).toBeVisible({ timeout: 10000 })
  
  // Wait for the reveal duration + a buffer
  await page.waitForTimeout((parseInt(revealDurationSeconds, 10) + 3) * 1000) // Wait for time to pass

  // Refresh capsule status by a UI action if available, or rely on polling/auto-refresh
  // For this test, we assume the reveal label will update or allow clicking.
  // A page reload might be too disruptive / slow down the test.
  // Let's try clicking the reveal input which should trigger status check and then auth.
  
  // The label should change to "Tap to reveal" or similar after time passes and status re-check (implicitly done by RevealInput or app logic)
  // This part is tricky without explicit refresh button in UI. We might need to click something that triggers a state update.
  // Let's assume clicking the reveal input itself will handle the state transition.
  const revealReadyMask = page.locator('[data-label*="Tap to reveal"]')
  await expect(revealReadyMask).toBeVisible({ timeout: 10000 }) // Wait for UI to update to revealable state
  await revealReadyMask.click()

  // MetaMask will pop up for SIWE signing
  await wallet.sign() // This is for SIWE, not a transaction
  
  // After signing, the message should be fetched and displayed
  const revealedInput = page.locator('input[value="' + messageText + '"]')
  await expect(revealedInput).toBeVisible({ timeout: 10000 })
  await expect(revealedInput).toHaveValue(messageText)
})