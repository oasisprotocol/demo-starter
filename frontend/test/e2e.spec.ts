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

test('set and view message', async ({ wallet, page }) => {
  // Load page
  await page.getByTestId('rk-connect-button').click()
  await page.getByTestId('rk-wallet-option-injected-sapphire').click()
  await wallet.approve()

  // Set a message
  await page.locator(':text-matches("0x.{40}")').fill('hola amigos')
  const submitBtn = page.getByRole('button', { name: 'Set Message' })
  await submitBtn.click()
  await wallet.confirmTransaction()

  // Reveal the message
  await expect(submitBtn).toBeEnabled()
  await page.locator('[data-label="Tap to reveal"]').click()
  await wallet.confirmTransaction()

  // Assert message has been set
  await expect(page.locator('[data-label="Tap to reveal"]').locator('input')).toHaveValue('hola amigos')
})
