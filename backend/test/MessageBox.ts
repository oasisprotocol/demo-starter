import { expect } from "chai";
import { config, ethers } from "hardhat";
import {SiweMessage} from "siwe";
import "@nomicfoundation/hardhat-chai-matchers";
import {MessagePrefix, hashMessage, concat, toUtf8Bytes, toUtf8String} from "ethers";

describe("MessageBox", function () {
  async function deployMessageBox() {
    const MessageBox_factory = await ethers.getContractFactory("MessageBox");
    const messageBox = await MessageBox_factory.deploy("localhost");
    await messageBox.waitForDeployment();
    return { messageBox };
  }

  async function siweMsg(): Promise<string> {
    return new SiweMessage({
      domain: "localhost",
      address: await (await ethers.provider.getSigner(0)).getAddress(),
      statement: "I accept the ExampleOrg Terms of Service: http://localhost/tos",
      uri: "http://localhost:5173",
      version: "1",
      chainId: config.networks.hardhat.chainId,
    }).toMessage();
  }

  it("Should set message", async function () {
    const {messageBox} = await deployMessageBox();

    await messageBox.setMessage("hello world");

    // Check, if author is correctly set.
    expect(await messageBox.author()).to.equal(await (await ethers.provider.getSigner(0)).getAddress());

    // Author should read a message.
    const accounts = config.networks.hardhat.accounts;
    const acc = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(accounts.mnemonic), accounts.path+'/0');
    const sig = ethers.Signature.from(await acc.signMessage(siweMsg()));
    const bearer = messageBox.login(await siweMsg(), sig);
    expect(await messageBox.message(bearer)).to.equal("hello world");

    // Anyone else trying to read the message should fail.
    const acc2 = ethers.HDNodeWallet.fromMnemonic(ethers.Mnemonic.fromPhrase(accounts.mnemonic), accounts.path+'/1');
    const sig2 = ethers.Signature.from(await acc2.signMessage(siweMsg()))
    const bearer2 = messageBox.login(await siweMsg(), sig2);
    await expect(messageBox.message(bearer2)).to.be.reverted;

  });
});
