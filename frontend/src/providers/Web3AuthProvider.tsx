import { FC, PropsWithChildren, useEffect, useState } from 'react'
import { Web3AuthContext, Web3AuthProviderContext, Web3AuthProviderState } from './Web3AuthContext'
import { SiweMessage } from 'siwe'
import { useAccount, useReadContract, useSignMessage } from 'wagmi'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../constants/config'
import { parseSignature } from 'viem'

const web3AuthProviderInitialState: Web3AuthProviderState = {
  authInfo: null,
  signature: null,
  siweMessage: null,
}

export const Web3AuthContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, setState] = useState<Web3AuthProviderState>({
    ...web3AuthProviderInitialState,
  })

  const { chainId, address } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const {
    data: domain,
    error: readDomainError,
    refetch: refetchDomain,
  } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'domain',
  }) satisfies WagmiUseReadContractReturnType<'domain', string>

  const { data: retrievedAuthInfo } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'login',
    args: [state.siweMessage, state.signature],
    query: {
      enabled: state.siweMessage && state.signature,
    },
  }) satisfies WagmiUseReadContractReturnType<'login', string>

  useEffect(() => {
    if (retrievedAuthInfo !== state.authInfo) {
      setState(prevState => ({
        ...prevState,
        authInfo: retrievedAuthInfo!,
      }))
    }
  }, [retrievedAuthInfo])

  const fetchAuthInfo = async (): Promise<void> => {
    const { authInfo } = state

    if (authInfo) {
      console.debug('[Web3AuthContextProvider] AuthInfo already available, skipping...')
      return
    }

    if (!domain && readDomainError) {
      refetchDomain()
      throw new Error('Unable to retrieve domain, retrying. Try again later...')
    }

    const siweMessage = new SiweMessage({
      domain,
      address,
      uri: `http://${domain}`,
      version: '1',
      chainId: chainId,
    }).toMessage()

    const signature = await signMessageAsync({ message: siweMessage })
    const signatureRSV = parseSignature(signature)

    setState(prevState => ({
      ...prevState,
      signature: signatureRSV,
      siweMessage,
    }))
  }

  const providerState: Web3AuthProviderContext = {
    state,
    fetchAuthInfo,
  }

  return <Web3AuthContext.Provider value={providerState}>{children}</Web3AuthContext.Provider>
}
