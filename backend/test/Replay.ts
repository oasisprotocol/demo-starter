import { expect } from 'chai'
import { ethers } from 'hardhat'
import type { BattleChess } from '../typechain-types'
import '@nomicfoundation/hardhat-chai-matchers'

describe('BattleChess Replay Protection', () => {
  it('prevents hash reuse within the same game', async () => {
    const [alice, bob] = await ethers.getSigners()
    const F = await ethers.getContractFactory('BattleChess')
    const game = (await F.deploy()) as BattleChess

    // Create game
    const salt1 = ethers.randomBytes(32)
    const firstHash = ethers.keccak256(ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [12, 28, 0, salt1]))
    const id = await game.connect(alice).create.staticCall(firstHash, false)
    await game.connect(alice).create(firstHash, false)

    // Join game
    const salt2 = ethers.randomBytes(32)
    const blackFirstHash = ethers.keccak256(ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [52, 36, 0, salt2]))
    await game.connect(bob).join(id, blackFirstHash, false)

    // White reveals first move
    await game.connect(alice).reveal(id, 12, 28, 0, salt1)

    // Black reveals first move
    await game.connect(bob).reveal(id, 52, 36, 0, salt2)

    // White commits next move
    const salt3 = ethers.randomBytes(32)
    const moveHash3 = ethers.keccak256(ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [28, 36, 0, salt3]))
    await game.connect(alice).commit(id, moveHash3)

    // White reveals the move
    await game.connect(alice).reveal(id, 28, 36, 0, salt3)

    // Black commits a move
    const salt4 = ethers.randomBytes(32)
    const moveHash4 = ethers.keccak256(ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [51, 35, 0, salt4]))
    await game.connect(bob).commit(id, moveHash4)

    // Black reveals the move
    await game.connect(bob).reveal(id, 51, 35, 0, salt4)

    // White tries to commit the same hash again (moveHash3)
    await expect(game.connect(alice).commit(id, moveHash3))
      .to.be.revertedWith('hash used')

    // Test that first move hashes also can't be reused
    await expect(game.connect(alice).commit(id, firstHash))
      .to.be.revertedWith('hash used')
    
    await expect(game.connect(alice).commit(id, blackFirstHash))
      .to.be.revertedWith('hash used')
  })
})