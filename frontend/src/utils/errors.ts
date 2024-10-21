import { EthersError } from 'ethers'

const NETWORK_ERROR_MESSAGE = 'Unable to connect to RPC node! Please check your internet connection.'

export class UnknownNetworkError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export interface EIP1193Error extends Error {
  code: number
}

export const handleKnownErrors = (error: Error) => {
  const errorMessage = (error?.message ?? '').toLowerCase()

  switch (errorMessage) {
    case 'failed to fetch':
      throw new Error(NETWORK_ERROR_MESSAGE)
  }

  throw error
}

export const handleKnownEthersErrors = (error: EthersError) => {
  const errorCode = error?.code ?? ''

  switch (errorCode) {
    case 'ACTION_REJECTED':
      throw new Error('User rejected action, please try again.')
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
      throw new Error(NETWORK_ERROR_MESSAGE)
  }
  // Default to short message
  throw new Error(error?.shortMessage ?? error?.message ?? 'Unknown Error!')
}

export const toErrorString = (error: Error = new Error('Unknown error')) => {
  let errorString = ''

  if (Object.prototype.hasOwnProperty.call(error, 'message')) {
    errorString = (error as Error).message
  } else if (typeof error === 'object') {
    errorString = JSON.stringify(errorString)
  } else {
    errorString = error
  }

  return errorString
}
