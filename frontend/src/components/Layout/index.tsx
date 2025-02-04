import { FC } from 'react'
import { Outlet } from 'react-router-dom'
import classes from './index.module.css'
import { Alert } from '../Alert'
import { useAppState } from '../../hooks/useAppState'
import { Button } from '../Button'
import { StringUtils } from '../../utils/string.utils'
import { LayoutBase } from '../LayoutBase'
import { LogoIcon } from '../icons/LogoIcon'
import { ConnectButton } from '@rainbow-me/rainbowkit'

export const Layout: FC = () => {
  const {
    state: { appError },
    clearAppError,
  } = useAppState()

  return (
    <LayoutBase
      header={
        <header className={classes.header}>
          <LogoIcon />
          <ConnectButton />
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
