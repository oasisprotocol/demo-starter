import ABI from '../../../backend/abis/MessageBox.json'
import { UseReadContractReturnType } from 'wagmi'
const { VITE_MESSAGE_BOX_ADDR } = import.meta.env

export const GITHUB_REPOSITORY_URL = 'https://github.com/oasisprotocol/demo-starter'
export const OASIS_DOCS_PAGE_URL = 'https://docs.oasis.io/'
export const OASIS_HOME_PAGE_URL = 'https://oasisprotocol.org/'

export const WAGMI_CONTRACT_CONFIG = {
  address: VITE_MESSAGE_BOX_ADDR as `0x${string}`,
  abi: ABI,
}

export type WagmiUseReadContractReturnType<
  F extends string,
  R = unknown,
  A extends readonly unknown[] = unknown[]
> = UseReadContractReturnType<typeof ABI, F, A, R | undefined>
