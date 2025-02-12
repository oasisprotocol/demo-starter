import { FC, useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import classes from './index.module.css'
import { RevealInput } from '../../components/Input/RevealInput'
import { Message } from '../../types'
import { StringUtils } from '../../utils/string.utils'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { useWeb3Auth } from '../../hooks/useWeb3Auth'

export const HomePage: FC = () => {
  const { address } = useAccount()
  const {
    state: { authInfo },
    fetchAuthInfo,
  } = useWeb3Auth()

  const { data: retrievedAuthor, refetch: refetchAuthor } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'author',
    query: {
      enabled: !!authInfo,
    },
  }) satisfies WagmiUseReadContractReturnType<'author', string>
  const { data: retrievedMessage, refetch: refetchMessage } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'message',
    args: [authInfo],
    query: {
      enabled: !!authInfo,
    },
  }) satisfies WagmiUseReadContractReturnType<'message', string, [string]>

  const {
    data: setMessageTxHash,
    writeContract,
    isPending: isWriteContractPending,
    isError: isWriteContractError,
    error: writeContractError,
  } = useWriteContract()
  const {
    isPending: isTransactionReceiptPending,
    isSuccess: isTransactionReceiptSuccess,
    isError: isTransactionReceiptError,
    error: transactionReceiptError,
  } = useWaitForTransactionReceipt({
    hash: setMessageTxHash,
  })

  const isInteractingWithChain = isWriteContractPending || (setMessageTxHash && isTransactionReceiptPending)

  const [message, setMessage] = useState<Message | null>(null)
  const [messageValue, setMessageValue] = useState<string>('')
  const [messageRevealLabel, setMessageRevealLabel] = useState<string>()
  const [messageError, setMessageError] = useState<string | null>(null)
  const [messageValueError, setMessageValueError] = useState<string>()
  const [hasBeenRevealedBefore, setHasBeenRevealedBefore] = useState(false)

  useEffect(() => {
    if (authInfo) {
      setMessage({
        message: retrievedMessage!,
        author: retrievedAuthor!,
      })
    }
  }, [retrievedAuthor, retrievedMessage])

  const fetchMessage = async () => {
    setMessageError(null)
    setMessageRevealLabel('Please sign message and wait...')

    try {
      await fetchAuthInfo()
      await refetchAuthor()
      await refetchMessage()
      setMessageRevealLabel(undefined)
      setHasBeenRevealedBefore(true)

      return Promise.resolve()
    } catch (ex) {
      setMessageError((ex as Error).message)
      setMessageRevealLabel('Something went wrong! Please try again...')

      throw ex
    }
  }

  useEffect(() => {
    if (isTransactionReceiptSuccess) {
      setMessageValue('')

      if (!hasBeenRevealedBefore) {
        setMessage(null)
        setMessageRevealLabel('Tap to reveal')
      } else {
        fetchMessage()
      }
    } else if (isTransactionReceiptError || isWriteContractError) {
      setMessageValueError(transactionReceiptError?.message ?? writeContractError?.message)
    }
  }, [isTransactionReceiptSuccess, isTransactionReceiptError, isWriteContractError])

  const handleRevealChanged = async (): Promise<void> => {
    if (!isInteractingWithChain) {
      return await fetchMessage()
    }

    return Promise.reject()
  }

  const handleSetMessage = async () => {
    setMessageValueError(undefined)

    if (!messageValue) {
      setMessageValueError('Message is required!')

      return
    }

    await writeContract({
      ...WAGMI_CONTRACT_CONFIG,
      functionName: 'setMessage',
      args: [messageValue],
    })
  }

  return (
    <div className={classes.homePage}>
      <Card header={<h2>Demo starter</h2>}>
        {address && (
          <>
            <div className={classes.activeMessageText}>
              <h3>Active message</h3>
              <p>Current message set in message box.</p>
            </div>
            <RevealInput
              value={message?.message ?? ''}
              label={message?.author}
              disabled
              reveal={!!message}
              revealLabel={!!message ? undefined : messageRevealLabel}
              onRevealChange={handleRevealChanged}
            />
            {messageError && <p className="error">{StringUtils.truncate(messageError)}</p>}
            <div className={classes.setMessageText}>
              <h3>Set message</h3>
              <p>Set your new message by filling the message field bellow.</p>
            </div>
            <Input
              value={messageValue}
              label={address ?? ''}
              onChange={setMessageValue}
              error={messageValueError}
              disabled={isInteractingWithChain}
            />
            <div className={classes.setMessageActions}>
              <Button disabled={isInteractingWithChain} onClick={handleSetMessage}>
                {isInteractingWithChain ? 'Please wait...' : 'Set Message'}
              </Button>
            </div>
          </>
        )}
        {!address && (
          <>
            <div className={classes.connectWalletText}>
              <p>Please connect your wallet to get started.</p>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
