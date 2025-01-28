import { useContext } from 'react'
import { AppStateContext } from '../providers/AppStateContext'

export const useAppState = () => {
  const value = useContext(AppStateContext)
  if (Object.keys(value).length === 0) {
    throw new Error('[useAppState] Component not wrapped within a Provider')
  }

  return value
}
