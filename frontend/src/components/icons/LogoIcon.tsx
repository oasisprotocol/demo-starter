import { FC } from 'react'

interface Props {
  className?: string
}

export const LogoIcon: FC<Props> = ({ className }) => {
  return (
    <img
      className={className}
      height="31"
      src="https://assets.oasis.io/logotypes/Network White.svg"
      alt="Oasis Network"
    />
  )
}
