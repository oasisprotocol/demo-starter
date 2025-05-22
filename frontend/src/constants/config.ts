import ABI from '../../../backend/abis/TimeCapsule.json' // Updated ABI path
import { UseReadContractReturnType, UseWriteContractReturnType } from 'wagmi' // Added UseWriteContractReturnType
const { VITE_MESSAGE_BOX_ADDR } = import.meta.env // This env var name can remain or be changed

export const GITHUB_REPOSITORY_URL = 'https://github.com/oasisprotocol/demo-starter'
export const OASIS_DOCS_PAGE_URL = 'https://docs.oasis.io/'
export const OASIS_HOME_PAGE_URL = 'https://oasisprotocol.org/'

export const WAGMI_CONTRACT_CONFIG = {
  address: VITE_MESSAGE_BOX_ADDR as `0x${string}`, // Assuming this address points to the deployed TimeCapsule
  abi: ABI, // Using the new TimeCapsule ABI
}

// Adjusted generic types for read and write contract hooks
export type WagmiUseReadContractReturnType<
  F extends string,
  R = unknown,
  A extends readonly unknown[] = unknown[]
> = UseReadContractReturnType<typeof ABI, F, A, R | undefined>

export type WagmiUseWriteContractReturnType<
  F extends string,
  A extends readonly unknown[] = unknown[]
> = UseWriteContractReturnType<typeof ABI, F, A>