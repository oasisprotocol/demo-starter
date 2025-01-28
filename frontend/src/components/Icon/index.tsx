import { cloneElement, FC, ReactElement, SVGProps } from 'react'
import { IconProps, IconSize } from '../../types'

interface Props extends IconProps {
  children: ReactElement
}

const sizeMap: Record<IconSize, Partial<SVGProps<SVGSVGElement>>> = {
  small: {
    width: 14,
    height: 14,
  },
  medium: {
    width: 30,
    height: 30,
  },
  large: {
    width: 64,
    height: 64,
  },
  xlarge: {
    width: 100,
    height: 100,
  },
}

export const Icon: FC<Props> = ({ children, size = 'medium', width, height, className }) => {
  return cloneElement(children, {
    ...(sizeMap[size] ? sizeMap[size] : {}),
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
    className,
  })
}
