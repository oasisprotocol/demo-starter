/// <reference types="vite-plugin-svgr/client" />

import { FC } from 'react'
import CheckSvg from '@material-design-icons/svg/filled/check.svg?react'
import { Icon } from '../Icon'
import { IconProps } from '../../types'

export const CheckIcon: FC<IconProps> = props => (
  <Icon {...props}>
    <CheckSvg />
  </Icon>
)
