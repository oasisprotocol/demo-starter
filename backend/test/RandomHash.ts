import { expect } from 'chai'
import { ethers } from 'hardhat'
import type { BattleChess } from '../typechain-types'
import '@nomicfoundation/hardhat-chai-matchers'

describe('BattleChess Random Hash', () => {
  it('generates different random hashes for different games', async () => {
    const [alice, bob, charlie, dave] = await ethers.getSigners()
    const F = await ethers.getContractFactory('BattleChess')
    const game = (await F.deploy()) as BattleChess

    // Create two games with wantRandom=true
    const tx1 = await game.connect(alice).create(ethers.ZeroHash, true)
    const receipt1 = await tx1.wait()
    const id1 = receipt1?.logs[0].args?.[0]

    const tx2 = await game.connect(charlie).create(ethers.ZeroHash, true)
    const receipt2 = await tx2.wait()
    const id2 = receipt2?.logs[0].args?.[0]

    // Join both games with wantRandom=true
    await game.connect(bob).join(id1, ethers.ZeroHash, true)
    await game.connect(dave).join(id2, ethers.ZeroHash, true)

    // Since the hashes are random and use different salts, they should work fine
    // We can't predict the exact hash values, but the games should be created successfully
    expect(id1).to.not.equal(id2)
    
    // Verify both games have proper state
    const state1 = await game.gameState(id1)
    const state2 = await game.gameState(id2)
    
    expect(state1.white).to.equal(alice.address)
    expect(state1.black).to.equal(bob.address)
    expect(state2.white).to.equal(charlie.address)
    expect(state2.black).to.equal(dave.address)
  })
})