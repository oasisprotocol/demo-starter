import { expect } from 'chai'
import { config, ethers } from 'hardhat'
import type { HDNodeWallet } from 'ethers'
import { SiweMessage } from 'siwe'
import '@nomicfoundation/hardhat-chai-matchers'
import { TimeCapsule } from '../typechain-types' // Adjusted import
import { HDAccountsUserConfig } from 'hardhat/types'

describe('TimeCapsule', function () {
  async function deployTimeCapsule() {
    const TimeCapsule_factory = await ethers.getContractFactory('TimeCapsule')
    const timeCapsule: TimeCapsule = await TimeCapsule_factory.deploy('localhost')
    await timeCapsule.waitForDeployment()
    return { timeCapsule }
  }

  async function getSiweMsg(account: HDNodeWallet, domain: string): Promise<string> {
    return new SiweMessage({
      domain, // Use the domain from the contract
      address: await account.getAddress(),
      statement: 'I accept the ExampleOrg Terms of Service: http://localhost/tos',
      uri: `http://${domain}`,
      version: '1',
      chainId: Number((await ethers.provider.getNetwork()).chainId),
    }).toMessage()
  }

  it('Should set message and reveal it after time passes', async function () {
    // Skip this test on non-sapphire chains if relying on authMsgSender features not universally available/mocked.
    if ((await ethers.provider.getNetwork()).chainId === 1337n && !process.env.CI) {
      // Keep CI running, adjust if specific Sapphire features are crucial and not mocked
      // this.skip()
    }

    const { timeCapsule } = await deployTimeCapsule()
    const [owner, acc2] = await ethers.getSigners()

    const messageContent = 'hello time capsule'
    const revealDelaySeconds = 5 // 5 seconds

    // Set message
    await expect(timeCapsule.connect(owner).setMessage(messageContent, revealDelaySeconds))
      .to.emit(timeCapsule, 'MessageSet')
      .withArgs(
        await owner.getAddress(),
        messageContent,
        (await ethers.provider.getBlock('latest'))!.timestamp + revealDelaySeconds
      ) // Approximate, check within range or re-fetch block

    const initialStatus = await timeCapsule.getCapsuleStatus()
    expect(initialStatus.currentAuthor).to.equal(await owner.getAddress())
    expect(initialStatus.isReadyToReveal).to.be.false

    // Attempt to get message before time
    const hardhatAccounts = config.networks.hardhat.accounts as HDAccountsUserConfig
    const ownerWallet = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(hardhatAccounts.mnemonic!),
      hardhatAccounts.path + '/0'
    )

    const contractDomain = await timeCapsule.domain()
    let siweMsg = await getSiweMsg(ownerWallet, contractDomain)
    let sig = ethers.Signature.from(await ownerWallet.signMessage(siweMsg))
    let bearer = await timeCapsule.login(siweMsg, sig)

    await expect(timeCapsule.getMessage(bearer)).to.be.revertedWithCustomError(timeCapsule, 'CapsuleLocked')

    // Increase time
    await ethers.provider.send('evm_increaseTime', [revealDelaySeconds + 1])
    await ethers.provider.send('evm_mine', [])

    const afterTimeStatus = await timeCapsule.getCapsuleStatus()
    expect(afterTimeStatus.isReadyToReveal).to.be.true

    // Successfully get message by author
    // Re-fetch bearer token if necessary, though for view calls it might persist if not tied to nonce strictly
    // For safety, could re-login if SIWE nonces or expiries were involved, but SiweAuth here is simpler.
    const [revealedMessage, msgAuthor, msgRevealTimestamp] = await timeCapsule.getMessage(bearer)
    expect(revealedMessage).to.equal(messageContent)
    expect(msgAuthor).to.equal(await owner.getAddress())

    // Attempt to get message by non-author after time
    const acc2Wallet = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(hardhatAccounts.mnemonic!),
      hardhatAccounts.path + '/1'
    )
    siweMsg = await getSiweMsg(acc2Wallet, contractDomain) // acc2Wallet for SIWE message
    sig = ethers.Signature.from(await acc2Wallet.signMessage(siweMsg))
    bearer = await timeCapsule.login(siweMsg, sig) // login as acc2

    await expect(timeCapsule.connect(acc2).getMessage(bearer)).to.be.revertedWithCustomError(
      timeCapsule,
      'NotAuthor'
    )
  })

  it('Should allow setting a new message, overwriting the old one', async function () {
    const { timeCapsule } = await deployTimeCapsule()
    const [owner, acc2] = await ethers.getSigners()

    await timeCapsule.connect(owner).setMessage('Original message', 10)
    let status = await timeCapsule.getCapsuleStatus()
    expect(status.currentAuthor).to.equal(await owner.getAddress())

    const newMessageContent = 'New message by acc2'
    const newRevealDelay = 20
    await timeCapsule.connect(acc2).setMessage(newMessageContent, newRevealDelay)

    status = await timeCapsule.getCapsuleStatus()
    expect(status.currentAuthor).to.equal(await acc2.getAddress())
    expect(status.currentRevealTimestamp).to.equal(
      (await ethers.provider.getBlock('latest'))!.timestamp + newRevealDelay
    )

    // Increase time to reveal new message
    await ethers.provider.send('evm_increaseTime', [newRevealDelay + 1])
    await ethers.provider.send('evm_mine', [])

    const hardhatAccounts = config.networks.hardhat.accounts as HDAccountsUserConfig
    const acc2Wallet = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(hardhatAccounts.mnemonic!),
      hardhatAccounts.path + '/1'
    )
    const contractDomain = await timeCapsule.domain()
    const siweMsg = await getSiweMsg(acc2Wallet, contractDomain)
    const sig = ethers.Signature.from(await acc2Wallet.signMessage(siweMsg))
    const bearer = await timeCapsule.login(siweMsg, sig)

    const [revealedMessage, msgAuthor] = await timeCapsule.connect(acc2).getMessage(bearer)
    expect(revealedMessage).to.equal(newMessageContent)
    expect(msgAuthor).to.equal(await acc2.getAddress())
  })

  it('getCapsuleStatus should return correct status', async function () {
    const { timeCapsule } = await deployTimeCapsule()
    const [owner] = await ethers.getSigners()
    const messageContent = 'Status test'
    const revealDelaySeconds = 60

    // Initially, no message set
    let status = await timeCapsule.getCapsuleStatus()
    expect(status.currentAuthor).to.equal(ethers.ZeroAddress) // Assuming author is address(0) initially
    expect(status.currentRevealTimestamp).to.equal(0)
    expect(status.isReadyToReveal).to.be.true // or false if 0 timestamp is considered not ready by logic. Given block.timestamp >= 0, it is true.

    await timeCapsule.connect(owner).setMessage(messageContent, revealDelaySeconds)

    status = await timeCapsule.getCapsuleStatus()
    expect(status.currentAuthor).to.equal(await owner.getAddress())
    expect(status.currentRevealTimestamp).to.be.gt(0)
    expect(status.isReadyToReveal).to.be.false

    await ethers.provider.send('evm_increaseTime', [revealDelaySeconds + 1])
    await ethers.provider.send('evm_mine', [])

    status = await timeCapsule.getCapsuleStatus()
    expect(status.isReadyToReveal).to.be.true
  })

  it('setMessage should require positive reveal duration', async function () {
    const { timeCapsule } = await deployTimeCapsule()
    const [owner] = await ethers.getSigners()
    await expect(timeCapsule.connect(owner).setMessage('test', 0)).to.be.revertedWithCustomError(
      timeCapsule,
      'RevealDurationMustBePositive'
    )
  })
})
