import { expect } from "chai";
import { config, ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";

describe("MessageBox", function () {
  async function deployMessageBox() {
    const MessageBox_factory = await ethers.getContractFactory("MessageBox");
    const messageBox = await MessageBox_factory.deploy();
    await messageBox.waitForDeployment();
    return { messageBox };
  }

  it("Should set message", async function () {
    const {messageBox} = await deployMessageBox();

    await messageBox.setMessage("hello world");

    // Check, if author is correctly set.
    expect(await messageBox.author()).to.equal(await (await ethers.provider.getSigner(0)).getAddress());

    // Author should read a message.
    const accounts = config.networks.hardhat.accounts;
    const privKey = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(accounts.mnemonic), accounts.path+'/0').privateKey;
    const auth = (new ethers.SigningKey(privKey)).sign(ethers.keccak256(new Uint8Array()));
    expect(await messageBox.message(auth)).to.equal("hello world");

    // Anyone else trying to read the message should fail.
    const privKey2 = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(accounts.mnemonic), accounts.path+'/1').privateKey;
    const auth2 = (new ethers.SigningKey(privKey2)).sign(ethers.keccak256(new Uint8Array()));
    await expect(messageBox.message(auth2)).to.be.reverted;
  });
});
