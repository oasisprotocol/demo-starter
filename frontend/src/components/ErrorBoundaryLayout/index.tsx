import { FC } from 'react'
import { LayoutBase } from '../LayoutBase'
import { Alert } from '../Alert'
import classes from './index.module.css'
import { toErrorString } from '../../utils/errors'
import { StringUtils } from '../../utils/string.utils'

interface Props {
  error: unknown
}

export const ErrorBoundaryLayout: FC<Props> = ({ error }) => (
  <LayoutBase>
    <Alert className={classes.errorAlert} type="error">
      {StringUtils.truncate(toErrorString(error as Error))}
    </Alert>
  </LayoutBase>
)
