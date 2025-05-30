import ABI from '../../../backend/abis/BattleChess.json'

export const GITHUB_REPOSITORY_URL = 'https://github.com/oasisprotocol/demo-starter'
export const OASIS_DOCS_PAGE_URL = 'https://docs.oasis.io/'
export const OASIS_HOME_PAGE_URL = 'https://oasisprotocol.org/'

export const WAGMI_CONTRACT_CONFIG = {
  address: import.meta.env.VITE_GAME_ADDR as `0x${string}`,
  abi: ABI,
  chainId: Number(import.meta.env.VITE_NETWORK),
}