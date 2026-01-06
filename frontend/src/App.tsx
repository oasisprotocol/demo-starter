import { FC } from 'react'
import { Layout } from './components/Layout'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Web3AuthContextProvider } from './providers/Web3AuthProvider'
import { AppStateContextProvider } from './providers/AppStateProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RouterErrorBoundary } from './components/RouterErrorBoundary'
import { WagmiProvider } from 'wagmi'
import { lightTheme, RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountAvatar } from './components/AccountAvatar'

import '@rainbow-me/rainbowkit/styles.css'
import { rainbowKitConfig } from './constants/rainbowkit-config'

const queryClient = new QueryClient()
const rainbowKitTheme: Theme = {
  ...lightTheme({ accentColor: 'var(--brand-extra-dark)' }),
  fonts: {
    body: 'inherit',
  },
}

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouterErrorBoundary />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '*',
        element: <HomePage />,
      },
    ],
  },
])

export const App: FC = () => {
  return (
    <ErrorBoundary>
      <WagmiProvider config={rainbowKitConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={rainbowKitTheme}
            avatar={({ size, address }) => <AccountAvatar size={size} address={address} />}
            modalSize="compact"
          >
            <Web3AuthContextProvider>
              <AppStateContextProvider>
                <RouterProvider router={router} />
              </AppStateContextProvider>
            </Web3AuthContextProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  )
}
