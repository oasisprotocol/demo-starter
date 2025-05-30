import { useReadContract } from 'wagmi'
import { useAccount } from 'wagmi'
import BattleChessJson from '../../../backend/abis/BattleChess.json'

const address = import.meta.env.VITE_GAME_ADDR as `0x${string}`

const WAGMI_CONTRACT_CONFIG = {
  address,
  abi: BattleChessJson as unknown as readonly any[],
} as const

export type Phase = 'Commit' | 'Reveal'

export const useBattleChess = (gameId: bigint | undefined) => {
  const { address: userAddress } = useAccount()

  const read = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'viewBoard',
    args: gameId ? [gameId] : undefined,
    query: {
      enabled: !!gameId,
      refetchInterval: 4_000,
    },
  })

  const { data: state } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'gameState',
    args: gameId ? [gameId] : undefined,
    query: { enabled: !!gameId, refetchInterval: 4_000 },
  })

  const phase = state ? ((state as any)[0] === 0 ? 'Commit' : 'Reveal') : 'Commit'
  const turnWhite = state ? (state as any)[1] : true
  const whiteAddress = state ? (state as any)[2] : null
  const blackAddress = state ? (state as any)[3] : null
  
  const isMyTurn = state
    ? (turnWhite && userAddress === whiteAddress) || (!turnWhite && userAddress === blackAddress)
    : false
  
  const playerColor = userAddress === whiteAddress ? 'white' : userAddress === blackAddress ? 'black' : null

  return {
    ...read,
    phase,
    turnWhite,
    isMyTurn,
    playerColor,
    contractConfig: WAGMI_CONTRACT_CONFIG,
  }
}
