import { useContext } from 'react'
import { Web3Context } from '../providers/Web3Context'

export const useWeb3 = () => {
  const value = useContext(Web3Context)
  if (Object.keys(value).length === 0) {
    throw new Error('[useWeb3] Component not wrapped within a Provider')
  }

  return value
}
