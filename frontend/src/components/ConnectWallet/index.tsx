import { FC, useEffect, useState } from 'react'
import { useWeb3 } from '../../hooks/useWeb3'
import { METAMASK_HOME_PAGE_URL } from '../../constants/config'
import { Button } from '../Button'
import { toErrorString, UnknownNetworkError } from '../../utils/errors'
import { ConnectedAccount } from '../ConnectedAccount'
import { useAppState } from '../../hooks/useAppState'
import classes from './index.module.css'
import { useNavigate } from 'react-router-dom'
import { StringUtils } from '../../utils/string.utils'

interface Props {
  inline?: boolean
}

export const ConnectWallet: FC<Props> = ({ inline }) => {
  const navigate = useNavigate()
  const { setAppError } = useAppState()

  const [isLoading, setIsLoading] = useState(false)
  const [providerAvailable, setProviderAvailable] = useState(true)
  const [isUnknownNetwork, setIsUnknownNetwork] = useState(false)

  const {
    state: { isConnected, account, chainName },
    connectWallet,
    switchNetwork,
    isProviderAvailable,
  } = useWeb3()

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard')
    }
  }, [isConnected, navigate])

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      setProviderAvailable(await isProviderAvailable())
      setIsLoading(false)
    }

    init().catch(ex => {
      setAppError(toErrorString(ex as Error))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnectWallet = async () => {
    setIsLoading(true)
    try {
      await connectWallet()
    } catch (ex) {
      if (ex instanceof UnknownNetworkError) {
        setIsUnknownNetwork(true)
      } else {
        setAppError(ex as Error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchNetwork = async () => {
    setIsLoading(true)
    try {
      await switchNetwork()
      setIsUnknownNetwork(false)
      await handleConnectWallet()
    } catch (ex) {
      setAppError(ex as Error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!isConnected && !providerAvailable && (
        <a href={METAMASK_HOME_PAGE_URL} target={'_blank'} rel={'noopener noreferrer'}>
          <Button
            className={StringUtils.clsx(classes.connectWalletBtn, inline ? classes.inline : undefined)}
            color="primary"
            disabled={isLoading}
          >
            Install MetaMask
          </Button>
        </a>
      )}
      {!isConnected && providerAvailable && isUnknownNetwork && (
        <Button
          className={StringUtils.clsx(classes.connectWalletBtn, inline ? classes.inline : undefined)}
          color="primary"
          disabled={isLoading}
          onClick={handleSwitchNetwork}
        >
          Switch Network
        </Button>
      )}
      {!isConnected && providerAvailable && !isUnknownNetwork && (
        <Button
          className={StringUtils.clsx(classes.connectWalletBtn, inline ? classes.inline : undefined)}
          color="primary"
          disabled={isLoading}
          onClick={handleConnectWallet}
        >
          Connect wallet
        </Button>
      )}
      {isConnected && account && (
        <ConnectedAccount
          className={StringUtils.clsx(
            classes.connectedAccount,
            inline ? classes.connectedAccountInline : undefined
          )}
          address={account}
          chainName={chainName!}
        />
      )}
    </>
  )
}
