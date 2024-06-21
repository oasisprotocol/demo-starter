import { expect } from "chai";
import { config, ethers } from "hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import {MessagePrefix, hashMessage, concat, toUtf8Bytes, toUtf8String} from "ethers";

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

    const siweMsg = toUtf8String(await messageBox.getSiweMsg());

    // Author should read a message.
    const accounts = config.networks.hardhat.accounts;
    const acc = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(accounts.mnemonic), accounts.path+'/0');
    const auth = ethers.Signature.from(await acc.signMessage(siweMsg));
    expect(await messageBox.message(auth)).to.equal("hello world");

    // Anyone else trying to read the message should fail.
    const acc2 = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(accounts.mnemonic), accounts.path+'/1');
    const auth2 = ethers.Signature.from(await acc2.signMessage(siweMsg))
    await expect(messageBox.message(auth2)).to.be.reverted;

  });
});
