import { expect } from 'chai'
import { ethers } from 'hardhat'
import type { BattleChess } from '../typechain-types'
import '@nomicfoundation/hardhat-chai-matchers'

describe('BattleChess Timeout Tests', () => {
  it('allows timeout claim during commit phase', async () => {
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

    // Now it's white's turn to commit, game is in Commit phase
    const gameState = await game.gameState(id)
    console.log('Game state after reveals:', gameState.phase, gameState.turnWhite)
    expect(gameState.phase).to.equal(0n) // Phase.Commit = 0
    expect(gameState.turnWhite).to.equal(true)

    // Mine 301 blocks to exceed the deadline
    for (let i = 0; i < 301; i++) {
      await ethers.provider.send('hardhat_mine', ['0x1'])
    }

    // Bob (black) should be able to claim timeout
    await expect(game.connect(bob).claimTimeout(id))
      .to.emit(game, 'GameEnded')
      .withArgs(id, bob.address, 'timeout')

    // Verify that white's pieces are cleared
    const boardView = await game.connect(bob).viewBoard(id)
    
    // Count white pieces (should be 0)
    let whitePieces = 0
    for (let i = 0; i < 64; i++) {
      if (boardView[i] >= 1 && boardView[i] <= 6) {
        whitePieces++
      }
    }
    expect(whitePieces).to.equal(0)
  })
})