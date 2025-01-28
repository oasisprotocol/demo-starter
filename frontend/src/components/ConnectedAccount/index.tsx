import { FC } from 'react'
import { JazzIcon } from '../JazzIcon'
import { useWeb3 } from '../../hooks/useWeb3'
import { StringUtils } from '../../utils/string.utils'
import classes from './index.module.css'
import { useAppState } from '../../hooks/useAppState'

interface Props {
  className?: string
  address: string
  chainName: string
}

export const ConnectedAccount: FC<Props> = ({ className, address, chainName }) => {
  const {
    state: { explorerBaseUrl },
  } = useWeb3()
  const {
    state: { isDesktopScreen },
  } = useAppState()

  const url = explorerBaseUrl ? StringUtils.getAccountUrl(explorerBaseUrl, address) : undefined
  const networkName = StringUtils.getNetworkFriendlyName(chainName)

  return (
    <a
      href={url}
      className={StringUtils.clsx(className, classes.connectedAccount)}
      target="_blank"
      rel="nofollow noreferrer"
    >
      <JazzIcon className={classes.jazzIcon} size={isDesktopScreen ? 30 : 28} address={address} />
      {isDesktopScreen && (
        <p className={classes.connectedAccountDetails}>
          <span className={classes.network}>{networkName}</span>
          <abbr title={address} className={StringUtils.clsx('mono', classes.connectedAccountAddress)}>
            {StringUtils.truncateAddress(address)}
          </abbr>
        </p>
      )}
    </a>
  )
}
