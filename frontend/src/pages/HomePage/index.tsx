import { FC, useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
import classes from './index.module.css'
import { useWeb3 } from '../../hooks/useWeb3'
import { RevealInput } from '../../components/Input/RevealInput'
import { Message } from '../../types'
import { StringUtils } from '../../utils/string.utils'

export const HomePage: FC = () => {
  const {
    state: { isConnected, isSapphire, isInteractingWithChain, account },
    getMessage: web3GetMessage,
    setMessage: web3SetMessage,
  } = useWeb3()
  const [message, setMessage] = useState<Message | null>(null)
  const [messageValue, setMessageValue] = useState<string>('')
  const [messageRevealLabel, setMessageRevealLabel] = useState<string>()
  const [messageError, setMessageError] = useState<string | null>(null)
  const [messageValueError, setMessageValueError] = useState<string>()

  const fetchMessage = async () => {
    setMessageRevealLabel('Please sign message and wait...')

    try {
      const retrievedMessage = await web3GetMessage()
      setMessage(retrievedMessage)
      setMessageRevealLabel(undefined)
    } catch (ex) {
      setMessageError((ex as Error).message)
      setMessageRevealLabel('Something went wrong!')
    }
  }

  useEffect(() => {
    if (isSapphire === null) {
      return
    }

    if (!isSapphire) {
      fetchMessage()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSapphire])

  const handleRevealChanged = () => {
    if (!isSapphire) {
      return
    }
    fetchMessage()
  }

  const handleSetMessage = async () => {
    setMessageValueError(undefined)

    if (!messageValue) {
      setMessageValueError('Message is required!')

      return
    }

    try {
      const retrievedMessage = await web3SetMessage(messageValue)
      setMessage(retrievedMessage)
      setMessageValue('')
    } catch (ex) {
      setMessageValueError((ex as Error).message)
    }
  }

  return (
    <div className={classes.homePage}>
      <Card header={<h2>Demo starter</h2>}>
        {isConnected && (
          <>
            <div className={classes.activeMessageText}>
              <h3>Active message</h3>
              <p>Current message set in message box.</p>
            </div>
            <RevealInput
              value={message?.message ?? ''}
              label={message?.author}
              disabled
              reveal={!!isSapphire}
              revealLabel={isSapphire ? messageRevealLabel : undefined}
              onRevealChange={handleRevealChanged}
            />
            {messageError && <p className="error">{StringUtils.truncate(messageError)}</p>}
            <div className={classes.setMessageText}>
              <h3>Set message</h3>
              <p>Set your new message by filling the message field bellow.</p>
            </div>
            <Input
              value={messageValue}
              label={account ?? ''}
              onChange={setMessageValue}
              error={messageValueError}
              disabled={isInteractingWithChain}
            />
            <div className={classes.setMessageActions}>
              <Button disabled={isInteractingWithChain} onClick={handleSetMessage}>
                {isInteractingWithChain ? 'Please wait...' : 'SetMessage'}
              </Button>
            </div>
          </>
        )}
        {!isConnected && (
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
