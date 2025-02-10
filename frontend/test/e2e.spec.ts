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
      seed: 'test test test test test test test test test test test junk', // Hardhat's default https://hardhat.org/hardhat-network/docs/reference#accounts
      headless: false,
    })

    // Add Sapphire Localnet as a custom network
    await wallet.addNetwork({
      networkName: 'Sapphire Localnet',
      rpc: 'http://localhost:8545',
      chainId: 23293,
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
  await page.goto('http://localhost:5173')
})

// TODO: improve test without reloading wallet page
test('set and view message', async ({ wallet, page }) => {
  // Load page
  await wallet.page.reload()
  await wallet.page.getByRole('button', { name: 'Connect' }).click()

  // Set a message
  await page.locator(':text-matches("0x.{40}")').fill('hola amigos')
  await page.getByRole('button', { name: 'Set Message' }).click()
  await wallet.page.reload()
  await wallet.page.getByRole('button', { name: 'Confirm' }).click()

  // Reveal the message
  await expect(page.getByRole('button', { name: 'Set Message' })).toBeVisible({ timeout: 60_000 })
  await page.locator('[data-label="Tap to reveal"]').click()
  await wallet.page.reload()
  await wallet.page.getByRole('button', { name: 'Confirm' }).click()

  // Assert message has been set
  await expect(page.locator('[data-label="Tap to reveal"]').locator('input')).toHaveValue('hola amigos')
})
