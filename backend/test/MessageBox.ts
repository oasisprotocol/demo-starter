import { expect } from "chai";
import { config, ethers } from "hardhat";
import {JsonRpcProvider} from "@ethersproject/providers";

describe("MessageBox", function () {
  async function deployMessageBox() {
    const MessageBox_factory = await ethers.getContractFactory("MessageBox");
    const messageBox = await MessageBox_factory.deploy();
    await messageBox.deployed();
    return { messageBox };
  }

  async function deployGasless() {
    const Gasless = await ethers.getContractFactory('Gasless');
    const gasless = await Gasless.deploy();

    // Derive the private key of the 1st (counting from 0) builtin hardhat test account.
    const accounts = config.networks.hardhat.accounts;
    const wallet1 = ethers.Wallet.fromMnemonic(
      accounts.mnemonic,
      accounts.path + `/1`,
    );
    const privateKey1 = wallet1.privateKey;

    // Use it as the relayer private key.
    await expect(
      await gasless.setKeypair({
        addr: wallet1.address,
        secret: Uint8Array.from(
          Buffer.from(wallet1.privateKey.substring(2), 'hex'),
        ),
        nonce: ethers.provider.getTransactionCount(wallet1.address),
      }),
    ).to.be.ok;

    return { gasless };
  }

  it("Should send message", async function () {
    const {messageBox} = await deployMessageBox();

    await messageBox.setMessage("hello world");

    expect(await messageBox.message()).to.equal("hello world");
    expect(await messageBox.author()).to.equal(await ethers.provider.getSigner(0).getAddress());
  });
/*
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
*/
  it("Should send private message with captcha", async function () {
    if ((await ethers.provider.getNetwork()).chainId == 1337) { // Requires RNG.
      this.skip();
    }

    const {messageBox} = await deployMessageBox();

    const [a, b] = await messageBox.computeCaptcha();
    const tx = await messageBox.setPrivateMessage((await ethers.getSigner(1)).address, "hello secret world", a.add(b));
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);

    // Captcha should change.
    const [c, d] = await messageBox.computeCaptcha();
    expect(c).to.not.equal(a);
    expect(d).to.not.equal(b);
  });

  it("Should send gasless message", async function () {
    if ((await ethers.provider.getNetwork()).chainId == 1337) { // Requires encryption, RNG etc.
      this.skip();
    }
    const { messageBox } = await deployMessageBox();
    const { gasless } = await deployGasless();

    const innercall = messageBox.interface.encodeFunctionData('setMessage', [
      'Hello, gratis world!',
    ]);
    const tx = await gasless.makeProxyTx(messageBox.address, innercall);

    const plainProvider = new ethers.providers.JsonRpcProvider(ethers.provider.connection);
    const plainResp = await plainProvider.sendTransaction(tx);

    const receipt = await ethers.provider.waitForTransaction(plainResp.hash);
    if (!receipt || receipt.status != 1) throw new Error('tx failed');  });
});
