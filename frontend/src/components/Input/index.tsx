import { ChangeEventHandler, FC, useId } from 'react'
import classes from './index.module.css'
import { StringUtils } from '../../utils/string.utils'

interface Props {
  required?: boolean
  label?: string
  error?: string
  className?: string
  value?: string
  disabled?: boolean
  onChange?: (value: string) => void
  type?: string
}

export const Input: FC<Props> = ({ required, label, error, className, disabled, value, onChange, type }) => {
  const id = useId()

  return (
    <div className={className}>
      <div className={classes.input}>
        <input
          value={value}
          placeholder=" "
          id={id}
          required={required}
          onChange={
            (({ target: { value } }) => {
              onChange?.(value)
            }) as ChangeEventHandler<HTMLInputElement>
          }
          autoComplete="off"
          disabled={disabled}
          type={type}
          className={StringUtils.clsx(disabled ? classes.inputDisabled : undefined)}
        />
        <label htmlFor={id}>{label}</label>
      </div>
      {error && <p className={StringUtils.clsx('error', classes.inputError)}>{error}</p>}
    </div>
  )
}
