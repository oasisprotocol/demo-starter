import { createContext } from 'react'

export interface Web3AuthProviderState {
  authInfo: string | null
  signature: any | null
  siweMessage: any | null
}

export interface Web3AuthProviderContext {
  readonly state: Web3AuthProviderState
  fetchAuthInfo: () => Promise<void>
}

export const Web3AuthContext = createContext<Web3AuthProviderContext>({} as Web3AuthProviderContext)
