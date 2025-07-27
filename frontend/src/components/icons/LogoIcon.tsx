import { FC } from 'react'

interface Props {
  className?: string
}

export const LogoIcon: FC<Props> = ({ className }) => {
  return (
    <img
      className={className}
      height="40"
      src="https://w.ladicdn.com/s550x550/592d6159ce9119f202e5f157/milliwatt-20240905055611-im1hf.jpg"
      alt="MW"
    />
  )
}
