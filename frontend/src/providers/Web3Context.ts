import { createContext } from 'react'
import { BrowserProvider, TransactionResponse } from 'ethers'

export interface Web3ProviderState {
  isConnected: boolean
  browserProvider: BrowserProvider | null
  account: string | null
  explorerBaseUrl: string | null
  chainName: string | null
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  } | null
  isInteractingWithChain: boolean
  chainId: bigint | null
}

export interface Web3ProviderContext {
  readonly state: Web3ProviderState
  connectWallet: () => Promise<void>
  switchNetwork: (chainId?: bigint) => Promise<void>
  getTransaction: (txHash: string) => Promise<TransactionResponse | null>
  getGasPrice: () => Promise<bigint>
  isProviderAvailable: () => Promise<boolean>
}

export const Web3Context = createContext<Web3ProviderContext>({} as Web3ProviderContext)
