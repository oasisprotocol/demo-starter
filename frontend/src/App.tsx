import { FC } from 'react'
import { Layout } from './components/Layout'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Web3AuthContextProvider } from './providers/Web3AuthProvider'
import { AppStateContextProvider } from './providers/AppStateProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RouterErrorBoundary } from './components/RouterErrorBoundary'
import { Chain, sapphire, sapphireTestnet } from 'viem/chains'
import { createConfig, Transport, WagmiProvider } from 'wagmi'
import { sapphireHttpTransport, sapphireLocalnet } from '@oasisprotocol/sapphire-viem-v2'
import { injectedWithSapphire } from '@oasisprotocol/sapphire-wagmi-v2'
import { lightTheme, RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AccountAvatar } from './components/AccountAvatar'

const { DEV, VITE_NETWORK } = import.meta.env

import '@rainbow-me/rainbowkit/styles.css'

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

const VITE_NETWORK_NUMBER = Number(VITE_NETWORK)

export const wagmiConfig = createConfig({
  // multiInjectedProviderDiscovery: false,
  chains: [
    ...(VITE_NETWORK_NUMBER === 0x5afe ? [sapphire] : []),
    ...(VITE_NETWORK_NUMBER === 0x5aff ? [sapphireTestnet] : []),
    ...(DEV && VITE_NETWORK_NUMBER === 0x5afd ? [sapphireLocalnet] : []),
  ] as unknown as [Chain],
  connectors: [injectedWithSapphire()],
  transports: {
    ...((VITE_NETWORK_NUMBER === 0x5afe ? { [sapphire.id]: sapphireHttpTransport() } : {}) as Transport),
    ...((VITE_NETWORK_NUMBER === 0x5aff
      ? { [sapphireTestnet.id]: sapphireHttpTransport() }
      : {}) as Transport),
    ...(DEV && VITE_NETWORK_NUMBER === 0x5afd ? { [sapphireLocalnet.id]: sapphireHttpTransport() } : {}),
  },
})

export const App: FC = () => {
  return (
    <ErrorBoundary>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={rainbowKitTheme}
            avatar={({ size, address }) => <AccountAvatar size={size} address={address} />}
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
