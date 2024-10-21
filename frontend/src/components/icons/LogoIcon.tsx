import { FC } from 'react'
import logoSvgSrc from '/logo.svg?url'

interface Props {
  className?: string
}

export const LogoIcon: FC<Props> = ({ className }) => {
  return <img className={className} height="31" src={logoSvgSrc} alt="Oasis Network" />
}
