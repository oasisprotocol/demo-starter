import { useContext } from 'react'
import { EIP1193Context } from '../providers/EIP1193Context'

export const useEIP1193 = () => {
  const value = useContext(EIP1193Context)
  if (Object.keys(value).length === 0) {
    throw new Error('[useEIP1193] Component not wrapped within a Provider')
  }

  return value
}
