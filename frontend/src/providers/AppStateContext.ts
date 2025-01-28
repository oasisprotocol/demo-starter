import { createContext } from 'react'

export interface AppStateProviderState {
  appError: string
  isDesktopScreen: boolean
  isMobileScreen: boolean
}

export interface AppStateProviderContext {
  readonly state: AppStateProviderState
  setAppError: (error: Error | object | string) => void
  clearAppError: () => void
}

export const AppStateContext = createContext<AppStateProviderContext>({} as AppStateProviderContext)
