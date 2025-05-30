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
  const isMyTurn = state
    ? ((state as any)[1] && userAddress === (state as any)[2]) || (!(state as any)[1] && userAddress === (state as any)[3])
    : false

  return {
    ...read,
    phase,
    isMyTurn,
    contractConfig: WAGMI_CONTRACT_CONFIG,
  }
}
