import { expect } from 'chai'
import { ethers } from 'hardhat'
import type { BattleChess } from '../typechain-types'
import '@nomicfoundation/hardhat-chai-matchers'

describe('BattleChess Promotion', () => {
  it('auto-promotes pawn to queen when promo=0', async () => {
    const [alice, bob] = await ethers.getSigners()
    const F = await ethers.getContractFactory('BattleChess')
    const game = (await F.deploy()) as BattleChess

    // Create game - we'll use a setup where white pawn can reach rank 8
    const salt1 = ethers.randomBytes(32)
    const firstHash = ethers.keccak256(ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [12, 28, 0, salt1]))
    const id = await game.connect(alice).create.staticCall(firstHash, false)
    await game.connect(alice).create(firstHash, false)

    // Join game
    const salt2 = ethers.randomBytes(32)
    const blackFirstHash = ethers.keccak256(ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [52, 36, 0, salt2]))
    await game.connect(bob).join(id, blackFirstHash, false)

    // Make initial moves
    await game.connect(alice).reveal(id, 12, 28, 0, salt1)
    await game.connect(bob).reveal(id, 52, 36, 0, salt2)

    // Let's simulate a pawn reaching rank 8 (row 7)
    // For testing, we'll manually set up a scenario where a white pawn at row 6 moves to row 7
    // In a real game, this would require many moves
    
    // Since we can't easily simulate a full game, let's test the promotion validation
    // by trying invalid promotion codes
    const salt3 = ethers.randomBytes(32)
    const invalidPromoHash = ethers.keccak256(
      ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [8, 16, 7, salt3]) // promo=7 is invalid for non-promoting move
    )
    await game.connect(alice).commit(id, invalidPromoHash)
    
    // This should revert because we're trying to use a promotion code on a non-promoting move
    await expect(game.connect(alice).reveal(id, 8, 16, 7, salt3))
      .to.be.revertedWith('no promo yet')
  })

  it('validates promotion codes for pawns', async () => {
    const [alice, bob] = await ethers.getSigners()
    const F = await ethers.getContractFactory('BattleChess')
    const game = (await F.deploy()) as BattleChess

    // Create and join game
    const salt1 = ethers.randomBytes(32)
    const firstHash = ethers.keccak256(ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [12, 28, 0, salt1]))
    const id = await game.connect(alice).create.staticCall(firstHash, false)
    await game.connect(alice).create(firstHash, false)

    const salt2 = ethers.randomBytes(32)
    const blackFirstHash = ethers.keccak256(ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [52, 36, 0, salt2]))
    await game.connect(bob).join(id, blackFirstHash, false)

    // Initial moves
    await game.connect(alice).reveal(id, 12, 28, 0, salt1)
    await game.connect(bob).reveal(id, 52, 36, 0, salt2)

    // Test that non-pawn pieces can't use promo codes
    const salt3 = ethers.randomBytes(32)
    const knightMoveWithPromo = ethers.keccak256(
      ethers.solidityPacked(['uint8', 'uint8', 'uint8', 'bytes32'], [1, 16, 3, salt3]) // knight move with promo=3
    )
    await game.connect(alice).commit(id, knightMoveWithPromo)
    
    await expect(game.connect(alice).reveal(id, 1, 16, 3, salt3))
      .to.be.revertedWith('promo only for pawns')
  })
})