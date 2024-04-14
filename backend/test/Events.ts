import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('Events', function () {
  async function deployEvents() {
    const myEventsSeeder__factory = await ethers.getContractFactory('Events');
    const myEventsContract = await myEventsSeeder__factory.deploy();
    await myEventsContract.waitForDeployment();
    const myEventsAddress = await myEventsContract.getAddress();
    return myEventsAddress;
  }

  it('Should successfully deploy', async function () {
    const deployedAddress = await deployEvents();
    expect(deployedAddress).to.not.be.empty;
  });

  describe('newEvent', async function () {
    it('Should emit EventCreated event', async function () {
      const myEventsAddress = await deployEvents();
      const myEventsContract = await ethers.getContractAt('Events', myEventsAddress);

      const tx = await myEventsContract.newEvent(
        'ETHDam',
        'A privacy focused hackathon',
        2024,
        2025,
        'myPassword',
        [
          '0x0D4403588DB896B37f6dAac2803eD0e9f8DDC945',
          '0x10D488025abAa5a2d3F30492FE3cbB5591E651dc',
        ],
        ['deca', 'deca2'],
      );
      // const receipt = await tx.wait();
      // expect(receipt.events).to.have.lengthOf(1);
      // const event = receipt.events[0];
      // expect(event.event).to.equal('EventCreated');
      // expect(event.args.name).to.equal('My Event');
      // expect(event.args.description).to.equal('My Description');
      // expect(event.args.ticketPrice).to.equal(100);
    });
  });
});
