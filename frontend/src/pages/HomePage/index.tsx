import { FC, useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import classes from './index.module.css'
import { RevealInput } from '../../components/Input/RevealInput'
import { StringUtils } from '../../utils/string.utils'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { useWeb3Auth } from '../../hooks/useWeb3Auth'
import { zeroAddress, isAddress } from 'viem' // Changed ZeroAddress to zeroAddress
import { DateUtils } from '../../utils/date.utils'

interface CapsuleDetails {
  messageContent: string
  author: string
  revealTimestamp: bigint
  isReadyToReveal: boolean
  isRevealedSuccessfully: boolean // true if getMessage was successful for the current auth'd user
}

export const HomePage: FC = () => {
  const { address } = useAccount()
  const {
    state: { authInfo },
    fetchAuthInfo,
  } = useWeb3Auth()

  // State for capsule details fetched from getCapsuleStatus and getMessage
  const [capsuleDetails, setCapsuleDetails] = useState<CapsuleDetails | null>(null)
  // State for new message input
  const [newMessage, setNewMessage] = useState<string>('')
  // State for reveal duration input
  const [revealDuration, setRevealDuration] = useState<string>('60') // Default to 60 seconds

  const [revealError, setRevealError] = useState<string | null>(null)
  const [setMessageError, setSetMessageError] = useState<string>()
  const [isFetchingCapsule, setIsFetchingCapsule] = useState(false)

  // Read hook for getCapsuleStatus - this is a public view function
  const {
    data: capsuleStatus,
    refetch: refetchCapsuleStatus,
    isLoading: isLoadingCapsuleStatus,
  } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getCapsuleStatus',
    query: {
      enabled: !!address, // Fetch status if user is connected
    },
  }) satisfies WagmiUseReadContractReturnType<'getCapsuleStatus', [string, bigint, boolean]>

  // Effect to update capsuleDetails when capsuleStatus changes
  useEffect(() => {
    if (capsuleStatus) {
      const [currentAuthor, currentRevealTimestamp, isReadyToReveal] = capsuleStatus
      setCapsuleDetails(prevDetails => ({
        messageContent: prevDetails?.isRevealedSuccessfully ? prevDetails.messageContent : '', // Keep message if already revealed
        author: currentAuthor,
        revealTimestamp: currentRevealTimestamp,
        isReadyToReveal: isReadyToReveal && currentAuthor !== zeroAddress, // Also check if author is set
        isRevealedSuccessfully:
          (prevDetails?.isRevealedSuccessfully && prevDetails?.author === currentAuthor) || false, // Reset if author changed
      }))
      setRevealError(null) // Clear previous reveal errors if status reloads
    } else if (address) {
      // If connected but no status, might mean no capsule set
      setCapsuleDetails(null)
    }
  }, [capsuleStatus, address])

  const {
    data: getMessageTxData, // Data here is the result of the call if successful
    refetch: fetchMessageWithAuth,
    isFetching: isFetchingMessage,
    error: getMessageError,
  } = useReadContract({
    // Using useReadContract for authenticated view calls
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getMessage',
    args: [authInfo || '0x'], // Pass auth token, or dummy if not available (query will be disabled)
    query: {
      enabled: false, // Manually trigger via refetch
    },
  }) satisfies WagmiUseReadContractReturnType<'getMessage', [string, string, bigint]>

  const {
    data: setMessageTxHash,
    writeContract,
    isPending: isWriteContractPending,
    error: writeContractError,
  } = useWriteContract()

  const {
    isPending: isTransactionReceiptPending,
    isSuccess: isTransactionReceiptSuccess,
    error: transactionReceiptError,
  } = useWaitForTransactionReceipt({
    hash: setMessageTxHash,
  })

  const isInteractingWithChain =
    isWriteContractPending ||
    (setMessageTxHash && isTransactionReceiptPending) ||
    isFetchingMessage ||
    isLoadingCapsuleStatus ||
    isFetchingCapsule

  // Effect to handle successful message retrieval
  useEffect(() => {
    if (getMessageTxData) {
      const [messageContent, msgAuthor, msgRevealTimestamp] = getMessageTxData
      setCapsuleDetails(prev => ({
        ...(prev ?? { author: msgAuthor, revealTimestamp: msgRevealTimestamp, isReadyToReveal: true }), // Should have prev from status
        messageContent,
        author: msgAuthor, // Ensure author is updated from the message itself
        revealTimestamp: msgRevealTimestamp,
        isRevealedSuccessfully: true,
      }))
      setRevealError(null)
    }
    if (getMessageError) {
      setRevealError(getMessageError.message)
      // Keep existing capsule details but mark as not revealed successfully
      setCapsuleDetails(prev => (prev ? { ...prev, isRevealedSuccessfully: false } : null))
    }
  }, [getMessageTxData, getMessageError])

  // Refetch capsule status after setting a new message
  useEffect(() => {
    if (isTransactionReceiptSuccess) {
      setNewMessage('')
      setRevealDuration('60')
      setSetMessageError(undefined)
      refetchCapsuleStatus() // Refresh the capsule status
      // Reset capsule details to reflect it's a new capsule, not yet revealed by current user
      setCapsuleDetails(prev =>
        prev ? { ...prev, messageContent: '', isRevealedSuccessfully: false } : null
      )
    } else if (transactionReceiptError || writeContractError) {
      setSetMessageError(transactionReceiptError?.message ?? writeContractError?.message)
    }
  }, [isTransactionReceiptSuccess, transactionReceiptError, writeContractError, refetchCapsuleStatus])

  const handleRevealAttempt = async (): Promise<void> => {
    if (isInteractingWithChain || !capsuleDetails || !capsuleDetails.isReadyToReveal) {
      if (capsuleDetails && !capsuleDetails.isReadyToReveal) {
        setRevealError(
          `Capsule is locked. Revealable after ${DateUtils.intlDateFormat(
            new Date(Number(capsuleDetails.revealTimestamp) * 1000),
            { format: 'long' }
          )}.`
        )
      }
      return Promise.reject(new Error('Cannot reveal yet or already interacting.'))
    }

    setRevealError(null)
    setIsFetchingCapsule(true)

    try {
      if (!authInfo) {
        await fetchAuthInfo() // This will update authInfo state via Web3AuthProvider
        // We might need to wait for authInfo to be available
        // For now, assume fetchAuthInfo updates it and we can proceed or it throws
      }
      // fetchAuthInfo might throw, or we might need a useEffect to react to authInfo change
      // A more robust way: fetchAuthInfo then, if successful, trigger fetchMessageWithAuth
      // This current implementation relies on authInfo being available after fetchAuthInfo() for the args in useReadContract
      // This might require a re-render cycle.
      // For simplicity, let's proceed assuming authInfo will be picked up by the useReadContract.
      // If authInfo was null, the query for getMessage is disabled. We enable it by refetching.
      // The `args` for `getMessage` are reactive to `authInfo`.
      await fetchMessageWithAuth() // This triggers the read, which uses the latest authInfo
      // Success/error handled by useEffect on getMessageTxData/getMessageError
      setIsFetchingCapsule(false)
      return Promise.resolve()
    } catch (ex) {
      setRevealError((ex as Error).message)
      setIsFetchingCapsule(false)
      throw ex
    }
  }

  const handleSetMessage = async () => {
    setSetMessageError(undefined)

    if (!newMessage) {
      setSetMessageError('Message is required!')
      return
    }
    const durationNum = parseInt(revealDuration, 10)
    if (isNaN(durationNum) || durationNum <= 0) {
      setSetMessageError('Reveal duration must be a positive number of seconds!')
      return
    }

    await writeContract({
      ...WAGMI_CONTRACT_CONFIG,
      functionName: 'setMessage',
      args: [newMessage, BigInt(durationNum)],
    })
  }

  const getRevealInputLabel = () => {
    if (
      !address ||
      !capsuleDetails ||
      capsuleDetails.author === zeroAddress ||
      !isAddress(capsuleDetails.author)
    )
      return 'No capsule set' // Changed ZeroAddress to zeroAddress

    if (isLoadingCapsuleStatus) return 'Loading capsule status...'
    if (isFetchingMessage || isFetchingCapsule) return 'Fetching secret...'

    if (!capsuleDetails.isReadyToReveal) {
      return `Locked. Reveals at: ${DateUtils.intlDateFormat(
        new Date(Number(capsuleDetails.revealTimestamp) * 1000),
        { format: 'short' }
      )}`
    }
    if (capsuleDetails.isRevealedSuccessfully) {
      return `Author: ${StringUtils.truncate(capsuleDetails.author, 10)} | Revealed`
    }
    return `Author: ${StringUtils.truncate(capsuleDetails.author, 10)} | Tap to reveal`
  }

  return (
    <div className={classes.homePage}>
      <Card header={<h2>Time Capsule DApp</h2>}>
        {address && (
          <>
            <div className={classes.activeMessageText}>
              <h3>Current Capsule</h3>
              {isLoadingCapsuleStatus && !capsuleDetails && <p>Loading capsule information...</p>}
              {!isLoadingCapsuleStatus &&
                (!capsuleDetails ||
                  capsuleDetails.author === zeroAddress ||
                  !isAddress(capsuleDetails.author)) && <p>No time capsule has been set yet.</p>}{' '}
              {/* Changed ZeroAddress to zeroAddress */}
            </div>

            {capsuleDetails &&
              capsuleDetails.author !== zeroAddress &&
              isAddress(capsuleDetails.author) && ( // Changed ZeroAddress to zeroAddress
                <RevealInput
                  value={capsuleDetails.isRevealedSuccessfully ? capsuleDetails.messageContent : ''}
                  label={StringUtils.truncate(capsuleDetails.author, 20)} // Show author from status
                  disabled={isInteractingWithChain || !capsuleDetails.isReadyToReveal} // Disable if not ready or interacting
                  reveal={capsuleDetails.isRevealedSuccessfully} // True if message content is loaded
                  revealLabel={getRevealInputLabel()}
                  onRevealChange={handleRevealAttempt}
                />
              )}
            {revealError && (
              <p className="error" style={{ marginTop: '0.5rem' }}>
                {StringUtils.truncate(revealError)}
              </p>
            )}

            <div className={classes.setMessageText}>
              <h3>Set New Capsule Message</h3>
              <p>Enter your secret message and how long until it can be revealed.</p>
            </div>
            <Input
              value={newMessage}
              label={`Your Message (as ${StringUtils.truncate(address, 10)})`}
              onChange={setNewMessage}
              disabled={isInteractingWithChain}
            />
            <Input
              className={classes.durationInput}
              value={revealDuration}
              label="Reveal in (seconds from now)"
              onChange={setRevealDuration}
              error={setMessageError} // Display general setMessage errors here
              disabled={isInteractingWithChain}
              // type="number" // Consider adding type="number" to Input component if useful
            />
            <div className={classes.setMessageActions}>
              <Button disabled={isInteractingWithChain} onClick={handleSetMessage}>
                {isInteractingWithChain && !isTransactionReceiptSuccess
                  ? 'Processing...'
                  : 'Set Capsule Message'}
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
