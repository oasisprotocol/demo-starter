import { expect } from "chai";
import { ethers } from "hardhat";
import {JsonRpcProvider} from "@ethersproject/providers";

describe("MessageBox", function () {
  async function deployMessageBox() {
    const MessageBox_factory = await ethers.getContractFactory("MessageBox");
    const messageBox = await MessageBox_factory.deploy();
    await messageBox.deployed();
    return { messageBox };
  }

  it("Should send message", async function () {
    const {messageBox} = await deployMessageBox();

    await messageBox.setMessage("hello world");

    expect(await messageBox.message()).to.equal("hello world");
    expect(await messageBox.author()).to.equal(await ethers.provider.getSigner(0).getAddress());
  });

  it("Should send and read private message", async function () {
    if ((await ethers.provider.getNetwork()).chainId != 1337) { // See https://github.com/oasisprotocol/sapphire-paratime/issues/197
      this.skip();
    }
    const {messageBox} = await deployMessageBox();

    await messageBox.setPrivateMessage((await ethers.getSigner(1)).address, "hello secret world");

    const messageBox2 = messageBox.connect(await ethers.getSigner(1));

    const [ privateMessage, privateAuthor ] = await messageBox2.readPrivateMessage();
    expect(privateMessage).to.equal("hello secret world");
    expect(privateAuthor).to.equal(await ethers.provider.getSigner(0).getAddress());
  });

  it("Should send and not unsigned read private message", async function () {
    if ((await ethers.provider.getNetwork()).chainId == 1337) { // Requires nullified msg.sender.
      this.skip();
    }

    const {messageBox} = await deployMessageBox();

    await messageBox.setPrivateMessage((await ethers.getSigner(1)).address, "hello secret world");

    const uwProvider = new JsonRpcProvider(ethers.provider.connection);
    const messageBox2 = await ethers.getContractAt("MessageBox", messageBox.address,  new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", uwProvider));

    const [ privateMessage ] = await messageBox2.readPrivateMessage();
    expect(privateMessage).to.equal("");
  });
});
