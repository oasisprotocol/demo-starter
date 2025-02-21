import { FC } from 'react'
import { Layout } from './components/Layout'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { Web3AuthContextProvider } from './providers/Web3AuthProvider'
import { AppStateContextProvider } from './providers/AppStateProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RouterErrorBoundary } from './components/RouterErrorBoundary'
import { Chain, sapphire, sapphireTestnet } from 'viem/chains'
import { createConfig, createConnector, Transport, WagmiProvider } from 'wagmi'
import {
  injectedWithSapphire,
  sapphireHttpTransport,
  sapphireLocalnet,
} from '@oasisprotocol/sapphire-wagmi-v2'
import { connectorsForWallets, lightTheme, RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit'
import { injectedWallet } from '@rainbow-me/rainbowkit/wallets'
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
  multiInjectedProviderDiscovery: false,
  connectors: [
    ...connectorsForWallets(
      [
        {
          groupName: 'Recommended',
          wallets: [
            (wallet => () => ({
              ...wallet,
              id: 'injected-sapphire',
              name: 'Injected (Sapphire)',
              createConnector: walletDetails =>
                createConnector(config => ({
                  ...injectedWithSapphire()(config),
                  ...walletDetails,
                })),
            }))(injectedWallet()),
          ],
        },
      ],
      { appName: 'Demo starter', projectId: 'PROJECT_ID' }
    ),
  ],
  chains: [
    ...(VITE_NETWORK_NUMBER === 0x5afe ? [sapphire] : []),
    ...(VITE_NETWORK_NUMBER === 0x5aff ? [sapphireTestnet] : []),
    ...(DEV && VITE_NETWORK_NUMBER === 0x5afd ? [sapphireLocalnet] : []),
  ] as unknown as [Chain],
  transports: {
    ...((VITE_NETWORK_NUMBER === 0x5afe ? { [sapphire.id]: sapphireHttpTransport() } : {}) as Transport),
    ...((VITE_NETWORK_NUMBER === 0x5aff
      ? { [sapphireTestnet.id]: sapphireHttpTransport() }
      : {}) as Transport),
    ...(DEV && VITE_NETWORK_NUMBER === 0x5afd ? { [sapphireLocalnet.id]: sapphireHttpTransport() } : {}),
  },
  batch: {
    multicall: false,
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
