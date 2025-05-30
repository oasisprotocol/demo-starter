import { useState } from 'react'
import { useAccount, useWriteContract, usePublicClient, useChainId, useSwitchChain } from 'wagmi'
import { keccak256, encodePacked, type Hex } from 'viem'
import { useBattleChess } from '../hooks/useBattleChess'
import { useAppState } from '../hooks/useAppState'
import './GamePage.css'

type Board = readonly (number | bigint)[]

export default function GamePage() {
  const { isConnected } = useAccount()
  const { setAppError } = useAppState()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const expectedChainId = Number(import.meta.env.VITE_NETWORK)
  const [gameId, setGameId] = useState<bigint | undefined>(undefined)
  const [selection, setSelection] = useState<number|null>(null)
  const [isProcessingMove, setIsProcessingMove] = useState(false)
  const [pendingMove, setPendingMove] = useState<{from: number, to: number, salt: Hex} | null>(null)
  const [waitingForReveal, setWaitingForReveal] = useState(false)

  /* read "my" board with phase management */
  const { data: board, phase, setPhase, contractConfig } = useBattleChess(gameId)

  /* writer for commit / reveal */
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  
  /* wait for transaction */
  const waitForTx = async (hash: `0x${string}`) => {
    if (!publicClient) throw new Error('No public client')
    return await publicClient.waitForTransactionReceipt({ hash })
  }

  /* create game */
  const createGame = async () => {
    try {
      const hash = await writeContractAsync({
        ...contractConfig,
        functionName: 'create',
        args: ['0x0000000000000000000000000000000000000000000000000000000000000000' as Hex, true],
      })
      const receipt = await waitForTx(hash)
      // First topic = GameCreated(id,…)
      const idHex = receipt.logs[0].topics[1]
      setGameId(idHex ? BigInt(idHex) : 0n)
    } catch (error) {
      console.error('Failed to create game:', error)
      setAppError(error instanceof Error ? error.message : 'Failed to create game')
    }
  }

  /* join game */
  const joinGame = async (id: bigint) => {
    try {
      await writeContractAsync({
        ...contractConfig,
        functionName: 'join',
        args: [id, '0x0000000000000000000000000000000000000000000000000000000000000000' as Hex, true],
      })
      setGameId(id)
    } catch (error) {
      console.error('Failed to join game:', error)
      setAppError(error instanceof Error ? error.message : 'Failed to join game')
    }
  }

  /* click handler */
  const clickSq = async (sq: number) => {
    if (!isConnected || gameId === undefined || isProcessingMove || waitingForReveal) return
    
    if (selection === null) {
      setSelection(sq)
      return
    }
    
    const from = selection
    const to = sq
    const promo = 0
    // Generate a unique salt using timestamp for simplicity
    const salt = keccak256(encodePacked(['uint256'], [BigInt(Date.now())])) as Hex
    
    try {
      setIsProcessingMove(true)
      console.log('Committing move...')
      
      // Store move details for reveal
      setPendingMove({ from, to, salt })
      
      // Commit phase only
      const hash = keccak256(encodePacked(['uint8', 'uint8', 'uint8', 'bytes32'], [from, to, promo, salt]))
      const commitTx = await writeContractAsync({
        ...contractConfig,
        functionName: 'commit',
        args: [gameId, hash],
      })
      
      // Wait for commit to be mined
      await waitForTx(commitTx)
      
      // Reset selection and set waiting state
      setSelection(null)
      setIsProcessingMove(false)
      setWaitingForReveal(true)
    } catch (error) {
      console.error('Commit failed:', error)
      setAppError(error instanceof Error ? error.message : 'Failed to commit move')
      setSelection(null)
      setIsProcessingMove(false)
      setPendingMove(null)
    }
  }
  
  /* reveal handler */
  const revealMove = async () => {
    if (!pendingMove || !gameId || isProcessingMove) return
    
    try {
      setIsProcessingMove(true)
      console.log('Revealing move...')
      
      const revealTx = await writeContractAsync({
        ...contractConfig,
        functionName: 'reveal',
        args: [gameId, pendingMove.from, pendingMove.to, 0, pendingMove.salt],
      })
      
      // Wait for reveal to be mined
      await waitForTx(revealTx)
      
      // Reset state
      setPendingMove(null)
      setWaitingForReveal(false)
      setPhase('Commit')
      setIsProcessingMove(false)
    } catch (error) {
      console.error('Reveal failed:', error)
      setAppError(error instanceof Error ? error.message : 'Failed to reveal move')
      setIsProcessingMove(false)
    }
  }

  if (!isConnected) {
    return <p>Please connect your wallet</p>
  }
  
  if (chainId !== expectedChainId) {
    return (
      <div className="network-guard">
        <h2>Wrong Network</h2>
        <p>Please switch to the correct network to play.</p>
        <button onClick={() => switchChain({ chainId: expectedChainId })}>
          Switch Network
        </button>
      </div>
    )
  }

  if (!board) {
    return (
      <div>
        <p>No active game</p>
        <button onClick={createGame}>Create Game</button>
        <div>
          <input
            type="number"
            placeholder="Game ID"
            onChange={(e) => setGameId(BigInt(e.target.value))}
          />
          <button onClick={() => gameId !== undefined && joinGame(gameId)}>Join Game</button>
        </div>
      </div>
    )
  }

  const boardData = board as Board | undefined
  
  return (
    <div>
      <div className="turn-banner">
        {waitingForReveal ? (
          <span className="your-turn">Click "Reveal Move" to complete your turn</span>
        ) : phase === 'Commit' ? (
          <span className="your-turn">Your turn - Select a piece to move</span>
        ) : (
          <span className="waiting">Waiting for opponent...</span>
        )}
      </div>
      {isProcessingMove && <div className="status">Processing move...</div>}
      <div className={`board ${isProcessingMove || waitingForReveal ? 'waiting' : ''}`} role="grid" aria-label="Chess board">
        {Array.from({ length: 64 }).map((_, i) => {
          const piece = boardData?.[i]
          const pieceStr = pieceIcon(Number(piece || 0))
          return (
            <div
              key={i}
              className={`sq ${selection === i ? 'highlight' : ''}`}
              onClick={() => clickSq(i)}
              tabIndex={0}
              role="gridcell"
              aria-label={`Square ${Math.floor(i/8)+1}${String.fromCharCode(97+i%8)}${pieceStr ? `: ${getPieceName(Number(piece))}` : ''}`}
            >
              {pieceStr}
            </div>
          )
        })}
      </div>
      {waitingForReveal && (
        <div className="reveal-section">
          <button onClick={revealMove} disabled={isProcessingMove}>
            Reveal Move
          </button>
        </div>
      )}
    </div>
  )
}

function pieceIcon(code: number) {
  const map: { [k: number]: string } = {
    1: '♙', 2: '♙', 3: '♗', 4: '♖', 5: '♕', 6: '♔',
    7: '♟', 8: '♟', 9: '♝', 10: '♜', 11: '♛', 12: '♚'
  }
  return map[code] ?? ''
}

function getPieceName(code: number): string {
  const names: { [k: number]: string } = {
    1: 'white pawn', 2: 'white piece', 3: 'white bishop', 4: 'white rook', 5: 'white queen', 6: 'white king',
    7: 'black pawn', 8: 'black piece', 9: 'black bishop', 10: 'black rook', 11: 'black queen', 12: 'black king'
  }
  return names[code] ?? 'empty'
}