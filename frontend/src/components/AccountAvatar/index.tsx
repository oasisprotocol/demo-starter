import { FC } from 'react'
import { JazzIcon } from '../JazzIcon'

interface Props {
  size: number
  address: string
}

export const AccountAvatar: FC<Props> = ({ address, size }) => {
  if (!address) return null

  return <JazzIcon size={size} address={address} />
}
