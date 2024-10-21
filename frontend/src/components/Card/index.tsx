import { FC, PropsWithChildren, ReactNode } from 'react'
import classes from './index.module.css'
import { StringUtils } from '../../utils/string.utils'

interface Props extends PropsWithChildren {
  header?: ReactNode
  className?: string
}

export const Card: FC<Props> = ({ children, header, className }) => {
  return (
    <div className={StringUtils.clsx(classes.card, className)}>
      {header ? <div className={classes.cardHeader}>{header}</div> : null}
      {children}
    </div>
  )
}
