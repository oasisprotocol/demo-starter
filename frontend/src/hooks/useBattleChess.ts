import { useState } from 'react'
import { useReadContract } from 'wagmi'
import BattleChessAbi from '../../../backend/abis/BattleChess.json'

const address = import.meta.env.VITE_GAME_ADDR as `0x${string}`

const WAGMI_CONTRACT_CONFIG = {
  address,
  abi: BattleChessAbi,
} as const

export type Phase = 'Commit' | 'Reveal'

export const useBattleChess = (gameId: bigint | undefined) => {
  const [phase, setPhase] = useState<Phase>('Commit')
  
  const read = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'viewBoard',
    args: gameId ? [gameId] : undefined,
    query: {
      enabled: !!gameId,
      refetchInterval: 4_000,
    },
  })
  
  return {
    ...read,
    phase,
    setPhase,
    contractConfig: WAGMI_CONTRACT_CONFIG
  }
}