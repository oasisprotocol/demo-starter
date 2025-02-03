import { expect } from 'chai'
import { config, ethers } from 'hardhat'
import { SiweMessage } from 'siwe'
import '@nomicfoundation/hardhat-chai-matchers'

describe('MessageBox', function () {
  async function deployMessageBox() {
    const MessageBox_factory = await ethers.getContractFactory('MessageBox')
    const messageBox = await MessageBox_factory.deploy('localhost')
    await messageBox.waitForDeployment()
    return { messageBox }
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

  it('Should set message authenticated', async function () {
    // Skip this test on non-sapphire chains.
    // On-chain encryption and/or signing required for SIWE.
    if ((await ethers.provider.getNetwork()).chainId == 1337n) {
      this.skip()
    }

    const { messageBox } = await deployMessageBox()

    await messageBox.setMessage('hello world')

    // Check, if author is correctly set.
    expect(await messageBox.author()).to.equal(await (await ethers.provider.getSigner(0)).getAddress())
    // Author should be able to read a message.
    const accounts = config.networks.hardhat.accounts
    const account = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(accounts.mnemonic),
      accounts.path + '/0'
    )
    const siweMsg = await getSiweMsg(account)
    const sig = ethers.Signature.from(await account.signMessage(siweMsg))
    const bearer = await messageBox.login(siweMsg, sig)
    await expect(await messageBox.message(bearer)).to.be.equal('hello world')

    // Anyone else trying to read the message should fail.
    const acc2 = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(accounts.mnemonic),
      accounts.path + '/1'
    )
    const siweMsg2 = await getSiweMsg(acc2)
    const sig2 = ethers.Signature.from(await acc2.signMessage(siweMsg2))
    const bearer2 = await messageBox.login(siweMsg2, sig2)
    await expect(messageBox.message(bearer2)).to.be.reverted
  })
})
