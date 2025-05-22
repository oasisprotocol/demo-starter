import { FC, useEffect, useState } from 'react' // Removed useCallback as it's not strictly needed with new flow
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import classes from './index.module.css'
import { StringUtils } from '../../utils/string.utils'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { useWeb3Auth } from '../../hooks/useWeb3Auth'
import { zeroAddress, isAddress } from 'viem'
import { DateUtils } from '../../utils/date.utils'

interface CapsuleUIDetails {
  author: string
  revealTimestamp: bigint
  isReadyToReveal: boolean
  messageContent: string // Empty if not revealed or no capsule
  isRevealedSuccessfully: boolean // True if getMessage was successful for the current auth'd user
  hasCapsuleBeenSet: boolean // True if author is not zeroAddress
}

export const HomePage: FC = () => {
  console.log('[HomePage] Component rendered');
  const { address } = useAccount()
  const {
    state: { authInfo },
    fetchAuthInfo,
  } = useWeb3Auth()

  const [capsuleUiDetails, setCapsuleUiDetails] = useState<CapsuleUIDetails | null>(null)
  const [newMessage, setNewMessage] = useState<string>('')
  const [revealDuration, setRevealDuration] = useState<string>('300') // Default to 5 minutes (300 seconds)

  const [uiError, setUiError] = useState<string | null>(null) // For general UI feedback/errors
  const [setMessageError, setSetMessageError] = useState<string>() // Specific to set message form

  const [isAttemptingReveal, setIsAttemptingReveal] = useState(false)

  // Log initial states that might be relevant for "stuck at processing"
  useEffect(() => {
    console.log('[HomePage] Initial state check (mount):', {
      address,
      authInfoAvailable: !!authInfo,
    });
  }, []); // Empty dependency array, runs once on mount


  // Read hook for getCapsuleStatus
  const {
    data: capsuleStatusData,
    refetch: refetchCapsuleStatus,
    isLoading: isLoadingCapsuleStatus,
    error: capsuleStatusError,
  } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getCapsuleStatus',
    query: {
      enabled: !!address, // Fetch status if user is connected
      refetchInterval: 30000, // Poll for status changes (e.g., lock time passing)
    },
  }) satisfies WagmiUseReadContractReturnType<'getCapsuleStatus', [string, bigint, boolean]>


  useEffect(() => {
    console.log('[CapsuleStatus] Hook update:', { isLoadingCapsuleStatus, capsuleStatusData, capsuleStatusError });
  }, [isLoadingCapsuleStatus, capsuleStatusData, capsuleStatusError]);

  // Effect to update capsuleUiDetails when capsuleStatusData changes
  useEffect(() => {
    if (capsuleStatusError) {
      setUiError(`Error fetching capsule status: ${capsuleStatusError.message}`)
      setCapsuleUiDetails(null) // Reset on error
      return
    }

    if (capsuleStatusData) {
      const [currentAuthor, currentRevealTimestamp, isReady] = capsuleStatusData
      const hasCapsule = isAddress(currentAuthor) && currentAuthor !== zeroAddress

      setCapsuleUiDetails((prevDetails: CapsuleUIDetails | null) => {
        // If author or timestamp changed, it's a new/updated capsule, reset revealed message
        const isDifferentCapsule =
          prevDetails?.author !== currentAuthor || prevDetails?.revealTimestamp !== currentRevealTimestamp
        const messageContent = isDifferentCapsule ? '' : prevDetails?.messageContent || ''
        const isRevealedSuccessfully = isDifferentCapsule
          ? false
          : prevDetails?.isRevealedSuccessfully || false

        return {
          author: currentAuthor,
          revealTimestamp: currentRevealTimestamp,
          isReadyToReveal: isReady && hasCapsule,
          messageContent,
          isRevealedSuccessfully,
          hasCapsuleBeenSet: hasCapsule,
        }
      })
      setUiError(null) // Clear previous errors if status reloads
    } else if (address && !isLoadingCapsuleStatus) {
      // Connected, not loading, but no status data -> likely no capsule
      setCapsuleUiDetails({
        author: zeroAddress,
        revealTimestamp: 0n,
        isReadyToReveal: false,
        messageContent: '',
        isRevealedSuccessfully: false,
        hasCapsuleBeenSet: false,
      })
    }
  }, [capsuleStatusData, capsuleStatusError, address, isLoadingCapsuleStatus])

  // Read hook for getMessage (to reveal)
  const {
    data: getMessageTxData,
    refetch: fetchMessageWithAuthToken,
    isFetching: isFetchingMessage,
    error: getMessageError,
  } = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getMessage',
    args: [authInfo ?? '0x'] as const, // Pass auth token, or dummy if not available
    query: {
      enabled: false, // Manually trigger via refetch
    },
  }) satisfies WagmiUseReadContractReturnType<'getMessage', [string, string, bigint]>

  useEffect(() => {
    console.log('[GetMessage] Hook update:', { isFetchingMessage, getMessageTxData, getMessageError, authInfoAvailable: !!authInfo });
  }, [isFetchingMessage, getMessageTxData, getMessageError, authInfo]);


  // Write hook for setMessage
  const {
    data: setMessageTxHash,
    writeContract: executeSetMessage,
    isPending: isSetMessageWritePending,
    error: setMessageWriteError,
    reset: resetSetMessageWrite,
  } = useWriteContract()

  useEffect(() => {
    console.log('[SetMessageWrite] Hook update:', { setMessageTxHash, isSetMessageWritePending, setMessageWriteError });
  }, [setMessageTxHash, isSetMessageWritePending, setMessageWriteError]);


  const {
    isPending: isSetMessageTxReceiptPending,
    isSuccess: isSetMessageTxReceiptSuccess,
    error: setMessageTxReceiptError,
  } = useWaitForTransactionReceipt({
    hash: setMessageTxHash,
    chainId: Number(import.meta.env.VITE_NETWORK),
    confirmations: 1,
    query: {
      enabled: Boolean(setMessageTxHash), // Only start polling once we have a hash
    },
  })

  useEffect(() => {
    console.log('[SetMessageReceipt] Hook update:', {
      setMessageTxHash, // Log hash again for context
      isSetMessageTxReceiptPending,
      isSetMessageTxReceiptSuccess,
      setMessageTxReceiptError,
    });
  }, [setMessageTxHash, isSetMessageTxReceiptPending, isSetMessageTxReceiptSuccess, setMessageTxReceiptError]);


  // Combined loading state for disabling UI elements
  const isLoading =
    isLoadingCapsuleStatus ||
    isFetchingMessage ||
    isSetMessageWritePending ||
    (Boolean(setMessageTxHash) && isSetMessageTxReceiptPending) || // Only consider receipt pending if hash exists
    isAttemptingReveal

  useEffect(() => {
    console.log('[IsLoading] Calculated:', isLoading, {
      isLoadingCapsuleStatus,
      isFetchingMessage,
      isSetMessageWritePending,
      isSetMessageTxReceiptPending,
      isAttemptingReveal,
    });
  }, [isLoadingCapsuleStatus, isFetchingMessage, isSetMessageWritePending, isSetMessageTxReceiptPending, isAttemptingReveal, isLoading]);


  // Effect to handle successful message retrieval from getMessage()
  useEffect(() => {
    console.log('[GetMessage] Effect for getMessageTxData/Error triggered:', { getMessageTxData, getMessageError });
    if (getMessageTxData) {
      const [retrievedMessageContent, retrievedAuthor, retrievedRevealTimestamp] = getMessageTxData
      setCapsuleUiDetails((prev: CapsuleUIDetails | null) => {
        // Ensure we are updating the correct capsule's revealed state
        if (prev && prev.author === retrievedAuthor && prev.revealTimestamp === retrievedRevealTimestamp) {
          return {
            ...prev,
            messageContent: retrievedMessageContent,
            isRevealedSuccessfully: true,
          }
        }
        return prev // Or handle as an unexpected state if author/timestamp mismatch
      })
      setUiError(null)
      setIsAttemptingReveal(false)
      console.log('[GetMessage] Successfully processed revealed message.');
    }
    if (getMessageError) {
      setUiError(`Reveal failed: ${getMessageError.message}`)
      // Keep existing capsule details but mark as not revealed successfully
      setCapsuleUiDetails((prev: CapsuleUIDetails | null) =>
        prev ? { ...prev, isRevealedSuccessfully: false, messageContent: '' } : null
      )
      setIsAttemptingReveal(false)
      console.error('[GetMessage] Error revealing message:', getMessageError);
    }
  }, [getMessageTxData, getMessageError])

  // Effect to handle post-setMessage actions
  useEffect(() => {
    console.log('[SetMessage] Effect for post-setMessage actions triggered:', { isSetMessageTxReceiptSuccess, setMessageTxReceiptError, setMessageWriteError });
    if (isSetMessageTxReceiptSuccess) {
      setNewMessage('')
      setRevealDuration('300')
      setSetMessageError(undefined)
      setUiError('Capsule message set successfully!')
      refetchCapsuleStatus() // Refresh the capsule status
      // New capsule is set, so reset revealed state for the new/updated capsule
      setCapsuleUiDetails((prev: CapsuleUIDetails | null) =>
        prev
          ? { ...prev, messageContent: '', isRevealedSuccessfully: false, hasCapsuleBeenSet: true }
          : {
              author: address || zeroAddress, // Tentative author, status will update
              revealTimestamp: 0n, // Tentative, status will update
              isReadyToReveal: false,
              messageContent: '',
              isRevealedSuccessfully: false,
              hasCapsuleBeenSet: true,
            }
      )
      setTimeout(() => setUiError(null), 3000) // Clear success message
    } else if (setMessageTxReceiptError || setMessageWriteError) {
      setSetMessageError(
        `Set message failed: ${
          (setMessageTxReceiptError || setMessageWriteError)?.message || 'Unknown error'
        }`
      )
      console.error('[SetMessage] Failed to set message:', { setMessageTxReceiptError, setMessageWriteError });
      resetSetMessageWrite();
    }
  }, [
    isSetMessageTxReceiptSuccess,
    setMessageTxReceiptError,
    setMessageWriteError,
    refetchCapsuleStatus,
    address,
    resetSetMessageWrite,
  ])

  // Effect to trigger message fetching when authInfo is ready after initiating reveal
  useEffect(() => {
    console.log('[RevealFlow] Effect for authInfo/isAttemptingReveal triggered:', { isAttemptingReveal, authInfoAvailable: !!authInfo, isReady: capsuleUiDetails?.isReadyToReveal });
    if (isAttemptingReveal && authInfo && capsuleUiDetails?.isReadyToReveal) {
      const attemptFetch = async () => {
        console.log('[RevealFlow] Attempting to fetch message with auth token.');
        try {
          await fetchMessageWithAuthToken() // This uses the latest authInfo due to args reactivity
        } catch (e) {
          console.error('[RevealFlow] Error calling fetchMessageWithAuthToken (should be caught by hook):', e);
          // Error is handled by the getMessageError useEffect
          // setIsAttemptingReveal(false) will be handled there too
        }
        // No finally here for setIsAttemptingReveal, handled by getMessageError/Data effects
      }
      attemptFetch()
    } else if (isAttemptingReveal && !capsuleUiDetails?.isReadyToReveal) {
      // Attempting reveal but capsule is not ready (e.g. time lock)
      console.log('[RevealFlow] Capsule not ready for reveal.');
      setUiError('Capsule is not ready to be revealed yet.')
      setIsAttemptingReveal(false)
    }
  }, [authInfo, isAttemptingReveal, capsuleUiDetails?.isReadyToReveal, fetchMessageWithAuthToken])

  const handleRevealAttempt = async () => {
    console.log('[RevealAttempt] Clicked. isLoading:', isLoading, 'isReadyToReveal:', capsuleUiDetails?.isReadyToReveal);
    if (isLoading || !capsuleUiDetails || !capsuleUiDetails.isReadyToReveal) {
      if (capsuleUiDetails && !capsuleUiDetails.isReadyToReveal) {
        setUiError(
          `Capsule is locked. Revealable after ${DateUtils.intlDateFormat(
            new Date(Number(capsuleUiDetails.revealTimestamp) * 1000),
            { format: 'long' }
          )}.`
        )
      }
      return
    }

    setUiError(null)
    setIsAttemptingReveal(true) // Signal intent, useEffect will handle logic
    console.log('[RevealAttempt] Set isAttemptingReveal to true.');

    if (!authInfo) {
      console.log('[RevealAttempt] No authInfo, attempting to fetch.');
      try {
        await fetchAuthInfo() // Trigger SIWE authentication
        console.log('[RevealAttempt] fetchAuthInfo call completed.');
        // The useEffect for [authInfo, isAttemptingReveal] will pick this up
      } catch (ex) {
        const errorMessage = (ex as Error).message;
        setUiError(`Authentication failed: ${errorMessage}`)
        setIsAttemptingReveal(false)
        console.error('[RevealAttempt] Authentication failed:', errorMessage);
      }
    } else {
      console.log('[RevealAttempt] AuthInfo already present.');
    }
    // If authInfo is already present, the useEffect will also trigger due to isAttemptingReveal=true
  }

  const handleSetMessage = async () => {
    console.log('[SetMessageAttempt] Clicked. Current message:', newMessage, 'Duration:', revealDuration);
    setSetMessageError(undefined)
    setUiError(null)

    if (!newMessage.trim()) {
      console.log('[SetMessageAttempt] Validation failed: Message empty.');
      setSetMessageError('Message content cannot be empty.')
      return
    }
    const durationNum = parseInt(revealDuration, 10)
    if (isNaN(durationNum) || durationNum <= 0) {
      console.log('[SetMessageAttempt] Validation failed: Duration not positive number.');
      setSetMessageError('Reveal duration must be a positive number of seconds.')
      return
    }
    if (durationNum < 60) {
      console.log('[SetMessageAttempt] Validation failed: Duration less than 60s.');
      // Example: Enforce minimum duration
      setSetMessageError('Minimum reveal duration is 60 seconds.')
      return
    }

    console.log('[SetMessageAttempt] Calling executeSetMessage...');
    try {
      await executeSetMessage({
        ...WAGMI_CONTRACT_CONFIG,
        functionName: 'setMessage',
        args: [newMessage, BigInt(durationNum)],
      })
      console.log('[SetMessageAttempt] executeSetMessage call initiated (tx hash will be logged by hook).');
    } catch (error) {
      // This catch might not be hit if useWriteContract handles errors internally and updates its `error` state.
      // Wagmi's `writeContract` itself returns a promise that resolves to the hash or rejects.
      console.error('[SetMessageAttempt] Error directly from executeSetMessage call:', error);
      setSetMessageError(`Set message submission failed: ${(error as Error).message}`);
      // The `useEffect` for `setMessageWriteError` should also catch this.
    }
  }

  const renderCurrentCapsule = () => {
    if (isLoadingCapsuleStatus && !capsuleUiDetails) {
      return <p className={classes.infoText}>Loading capsule information...</p>
    }

    if (!capsuleUiDetails || !capsuleUiDetails.hasCapsuleBeenSet) {
      return <p className={classes.infoText}>No time capsule has been set on this contract yet.</p>
    }

    const { author, revealTimestamp, isReadyToReveal, messageContent, isRevealedSuccessfully } =
      capsuleUiDetails

    return (
      <div className={classes.capsuleDetailsSection}>
        <p>
          <strong>Author:</strong> <span className={classes.code}>{StringUtils.truncate(author, 20)}</span>
        </p>
        <p>
          <strong>Reveals At:</strong>{' '}
          {Number(revealTimestamp) > 0
            ? DateUtils.intlDateFormat(new Date(Number(revealTimestamp) * 1000), { format: 'long' })
            : 'N/A'}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          {isFetchingMessage || isAttemptingReveal
            ? 'Attempting to reveal...'
            : isRevealedSuccessfully
            ? 'Revealed to you'
            : isReadyToReveal
            ? 'Ready to Reveal'
            : 'Locked'}
        </p>

        {isRevealedSuccessfully ? (
          <div className={classes.revealedMessageContainer}>
            <h3>Revealed Message:</h3>
            <p className={classes.revealedMessageText}>{messageContent}</p>
          </div>
        ) : isReadyToReveal ? (
          <Button
            className={classes.actionButton}
            onClick={handleRevealAttempt}
            disabled={isLoading || address?.toLowerCase() !== author.toLowerCase()}
            title={address?.toLowerCase() !== author.toLowerCase() ? 'Only the author can reveal' : ''}
          >
            {isLoading && (isFetchingMessage || isAttemptingReveal) ? 'Revealing...' : 'Reveal Message'}
          </Button>
        ) : (
          <p className={classes.infoText}>Message is locked until the reveal time.</p>
        )}
      </div>
    )
  }

  return (
    <div className={classes.homePage}>
      <Card header={<h2>Oasis Time Capsule</h2>}>
        {!address ? (
          <div className={classes.connectWalletText}>
            <p>Please connect your wallet to interact with the Time Capsule.</p>
          </div>
        ) : (
          <>
            {uiError && <p className={`error ${classes.uiError}`}>{StringUtils.truncate(uiError, 300)}</p>}

            <div className={classes.section}>
              <h3>View Current Capsule</h3>
              {renderCurrentCapsule()}
            </div>

            <hr className={classes.separator} />

            <div className={classes.section}>
              <h3>Create or Update Capsule</h3>
              <p className={classes.subtext}>
                Set a new secret message. This will overwrite any existing capsule on this contract.
              </p>
              <Input
                className={classes.formInput}
                value={newMessage}
                label={`Your Secret Message`}
                onChange={setNewMessage}
                disabled={isLoading}
              />
              <Input
                className={classes.formInput}
                value={revealDuration}
                label="Reveal in (seconds from now, min 60)"
                onChange={setRevealDuration}
                disabled={isLoading}
                type="number" // Consider adding type="number" to Input component if useful
              />
              {setMessageError && (
                <p className={`error ${classes.formError}`}>{StringUtils.truncate(setMessageError)}</p>
              )}
              <div className={classes.formActions}>
                <Button className={classes.actionButton} disabled={isLoading} onClick={handleSetMessage}>
                  {isSetMessageWritePending || (Boolean(setMessageTxHash) && isSetMessageTxReceiptPending)
                    ? 'Processing...'
                    : 'Set/Update Capsule'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}