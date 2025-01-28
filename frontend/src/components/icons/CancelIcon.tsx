/// <reference types="vite-plugin-svgr/client" />

import { FC } from 'react'
import CancelSvg from '@material-design-icons/svg/filled/cancel.svg?react'
import { Icon } from '../Icon'
import { IconProps } from '../../types'

export const CancelIcon: FC<IconProps> = props => (
  <Icon {...props}>
    <CancelSvg />
  </Icon>
)
