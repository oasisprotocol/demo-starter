import { FC, useEffect, useState } from 'react'
import classes from './index.module.css'
import { StringUtils } from '../utils/string.utils'

type RevealProps<T> = {
  reveal: boolean
  revealLabel?: string
  onRevealChange: (reveal: boolean) => void
} & T

export const withReveal =
  <P1 extends object>(Component: FC<P1>) =>
  (props: RevealProps<P1>) => {
    const { reveal, revealLabel, onRevealChange, ...restProps } = props as RevealProps<P1>

    const [isRevealed, setIsRevealed] = useState(false)

    useEffect(() => {
      setIsRevealed(isRevealed)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reveal])

    return (
      <div
        data-label={revealLabel ?? 'Tap to reveal'}
        className={StringUtils.clsx(isRevealed && !revealLabel ? undefined : classes.mask)}
        onClick={() => {
          if (isRevealed) {
            return
          }
          setIsRevealed(true)
          onRevealChange(true)
        }}
      >
        <Component {...(restProps as P1)} />
      </div>
    )
  }
