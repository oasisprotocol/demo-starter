import { FC, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import classes from './index.module.css'
import { ConnectWallet } from '../ConnectWallet'
import { Alert } from '../Alert'
import { useAppState } from '../../hooks/useAppState'
import { Button } from '../Button'
import { StringUtils } from '../../utils/string.utils'
import { LayoutBase } from '../LayoutBase'
import { LogoIcon } from '../icons/LogoIcon'
import { useWeb3 } from '../../hooks/useWeb3'

export const Layout: FC = () => {
  const { connectWallet } = useWeb3()
  const {
    state: { appError, isMobileScreen },
    clearAppError,
  } = useAppState()

  useEffect(() => {
    try {
      connectWallet()
    } catch (e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <LayoutBase
      header={
        <header className={classes.header}>
          <LogoIcon />
          <ConnectWallet inline={isMobileScreen} />
        </header>
      }
    >
      <section className={classes.mainSection}>
        {appError && (
          <Alert
            type="error"
            actions={
              <Button variant="text" onClick={clearAppError}>
                &lt; Go back&nbsp;
              </Button>
            }
          >
            {StringUtils.truncate(appError)}
          </Alert>
        )}
        {!appError && <Outlet />}
      </section>
    </LayoutBase>
  )
}
