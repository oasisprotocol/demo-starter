import { useContext } from 'react'
import { Web3AuthContext } from '../providers/Web3AuthContext'

export const useWeb3Auth = () => {
  const value = useContext(Web3AuthContext)
  if (Object.keys(value).length === 0) {
    throw new Error('[useWeb3Auth] Component not wrapped within a Provider')
  }

  return value
}
