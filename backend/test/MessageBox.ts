import { expect } from "chai";
import { ethers } from "hardhat";

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

    expect(await messageBox.message()).to.equal("hello world");
    expect(await messageBox.author()).to.equal(await (await ethers.provider.getSigner(0)).getAddress());
  });
});
