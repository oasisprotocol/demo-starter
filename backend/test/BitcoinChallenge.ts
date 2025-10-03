import { expect } from 'chai'
import { config, ethers } from 'hardhat'
import { SiweMessage } from 'siwe'
import '@nomicfoundation/hardhat-chai-matchers'

describe('BitcoinChallenge', function () {
  async function deployBitcoinChallenge() {
    const BitcoinChallenge_factory = await ethers.getContractFactory('BitcoinChallenge')
    const bitcoinChallenge = await BitcoinChallenge_factory.deploy('localhost')
    await bitcoinChallenge.waitForDeployment()
    return { bitcoinChallenge: bitcoinChallenge }
  }

  async function getSiweMsg(account: ethers.HDNodeWallet): Promise<string> {
    return new SiweMessage({
      domain: 'localhost',
      address: await account.getAddress(),
      statement: 'I accept the ExampleOrg Terms of Service: http://localhost/tos',
      uri: 'http://localhost:5173',
      version: '1',
      chainId: Number((await ethers.provider.getNetwork()).chainId),
    }).toMessage()
  }

  it('Should get address and secret key authenticated', async function () {
    // Skip this test on non-sapphire chains.
    // On-chain encryption and/or signing required for SIWE.
    if ((await ethers.provider.getNetwork()).chainId == 1337n) {
      this.skip()
    }

    const { bitcoinChallenge } = await deployBitcoinChallenge()

    console.log(await bitcoinChallenge.getBitcoinAddress())
    await expect(await bitcoinChallenge.getBitcoinAddress()).to.be.not.null

    // Check, if author is correctly set.
    expect(await bitcoinChallenge.owner()).to.equal(await (await ethers.provider.getSigner(0)).getAddress())
    // Owner should be able to read secret key.
    const accounts = config.networks.hardhat.accounts
    const account = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(accounts.mnemonic),
      accounts.path + '/0'
    )
    const siweMsg = await getSiweMsg(account)
    const sig = ethers.Signature.from(await account.signMessage(siweMsg))
    const bearer = await bitcoinChallenge.login(siweMsg, sig)
    await expect(await bitcoinChallenge.getSecretKey(bearer)).to.be.not.null
    console.log(await bitcoinChallenge.getSecretKey(bearer))

    // Anyone else trying to read the secret key should fail.
    const acc2 = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(accounts.mnemonic),
      accounts.path + '/1'
    )
    const siweMsg2 = await getSiweMsg(acc2)
    const sig2 = ethers.Signature.from(await acc2.signMessage(siweMsg2))
    const bearer2 = await bitcoinChallenge.login(siweMsg2, sig2)
    await expect(bitcoinChallenge.getSecretKey(bearer2)).to.be.reverted
  })
})
