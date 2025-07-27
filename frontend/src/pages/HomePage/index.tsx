import { FC, useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import classes from './index.module.css'
// import { RevealInput } from '../../components/Input/RevealInput'
// import { Message } from '../../types'
// import { StringUtils } from '../../utils/string.utils'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { WAGMI_CONTRACT_CONFIG, WagmiUseReadContractReturnType } from '../../constants/config'
import { render } from 'react-dom'
// import { useWeb3Auth } from '../../hooks/useWeb3Auth'

function useFetchEmail() {
 const result = useReadContract({
    ...WAGMI_CONTRACT_CONFIG,
    functionName: 'getAllEmailsFlat',
  }) satisfies WagmiUseReadContractReturnType<'getAllEmailsFlat', [string[], boolean[], boolean[]], [string[], boolean[], boolean[]]>;

  console.log('Fetched emails:', result)
  if (!result.data) return [];

  const [emails, sentArr, repliedArr] = result.data as [string[], boolean[], boolean[]];

  return emails.map((email, idx) => ({
    email,
    sent: sentArr[idx],
    replied: repliedArr[idx],
  }));
}

export const HomePage: FC = () => {
  const { address } = useAccount()
  // const {
  //   state: { authInfo },
  //   fetchAuthInfo,
  // } = useWeb3Auth()

  // const { data: retrievedAuthor, refetch: refetchAuthor } = useReadContract({
  //   ...WAGMI_CONTRACT_CONFIG,
  //   functionName: 'author',
  //   query: {
  //     enabled: !!authInfo,
  //   },
  // }) satisfies WagmiUseReadContractReturnType<'author', string>


  const {
    data: setMessageTxHash,
    writeContract,
    isPending: isWriteContractPending,
    isError: isWriteContractError,
    error: _writeContractError,
  } = useWriteContract()

  const {
    isPending: isTransactionReceiptPending,
    isSuccess: _isTransactionReceiptSuccess,
    isError: _isTransactionReceiptError,
    error: _transactionReceiptError,
  } = useWaitForTransactionReceipt({
    hash: setMessageTxHash,
  })

  const isInteractingWithChain = isWriteContractPending || (setMessageTxHash && isTransactionReceiptPending)

  // const [message, setMessage] = useState<Message | null>(null)

  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    handleGetListEmail()
  }, [])

  let emails = useFetchEmail()
  console.log('Fetched emails:', emails)

  // useEffect(() => {
  //   if (_isTransactionReceiptSuccess) {
  //     console.log('Transaction successful:', setMessageTxHash)
  //     // Optionally, you can refetch the emails or update the state here
  //     emails = useFetchEmail()
  //     console.log('Updated emails after transaction:', emails)
  //   } else if (_isTransactionReceiptError) {
  //     console.error('Transaction failed:', _transactionReceiptError)
  //     // Handle the error accordingly   
  //   }
  // }, [_isTransactionReceiptSuccess, _isTransactionReceiptError, setMessageTxHash, _transactionReceiptError])

  // const fetchEmail = async () => {

  //   try {

  //   } catch (error) {
  //     console.error('Error fetching message:', error)
  //     // setMessageError(error.message)
  //   }
  // }

  const handleGetListEmail = async (): Promise<void> => {
    // if (!isInteractingWithChain) {
    //   return await fetchEmail()
    // }

    // return Promise.reject()
  }

  const handleSendEmail = async () => {

    if (!email) {
      return
    }

    let emailBody = {
      to: email,
      subject: 'Hello from MilliWatt',
      message: 'This is a test email sent from the MilliWatt smart contract.',
    }

    await fetch('https://tiny.little.app/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Email sent successfully:', data);
      })
      .catch(error => {
        console.error('Error sending email:', error);
      });

    await writeContract({
      ...WAGMI_CONTRACT_CONFIG,
      functionName: 'sendEmail',
      args: [email],
    })
  }

  const renderEmails = () => {
    return emails.map((email, index) => (
      <div key={index} className={classes.emailItem}>
        <span className={classes.emailAddress}>{email.email}</span>
        <span className={classes.emailStatus}>
          {email.sent ? 'Sent' : 'Not Sent'} - {email.replied ? 'Replied' : 'Not Replied'}
        </span>
      </div>
    ))
  }

  return (
    <div className={classes.homePage}>
      <Card header={<h2>MW SC Email - Send Email</h2>}>
        <h3>SC Address: <a href={`https://explorer.oasis.io/mainnet/sapphire/address/${WAGMI_CONTRACT_CONFIG.address}`} target="_blank">{WAGMI_CONTRACT_CONFIG.address}</a></h3>
        <br />
        {address && (
          <>
            <div className={classes.activeMessageText}>
              <h3>List email sent</h3>
              <p>Current list email status.</p>
            </div>
            
            {renderEmails()}

             {/* <Button disabled={isInteractingWithChain} onClick={handleGetListEmail}>
                {isInteractingWithChain ? 'Please wait...' : 'Fetch Emails'}
              </Button> */}

            <div className={classes.setMessageText}>
              <h3>Send Email</h3>
              <p>Send a email to the email below then wait for reply.</p>
            </div>

            <Input
              value={email}
              // label={address ?? ''}
              onChange={setEmail}
              error={isWriteContractError ? _writeContractError?.message : ''}
              disabled={isInteractingWithChain}
            />
            <div className={classes.setMessageActions}>
              <Button disabled={isInteractingWithChain} onClick={handleSendEmail}>
                {isInteractingWithChain ? 'Please wait...' : 'Send Email'}
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
