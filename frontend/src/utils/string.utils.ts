import { NETWORK_NAMES } from '../constants/config'

const truncateEthRegex = /^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/
const truncateOasisRegex = /^(oasis1[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/

export abstract class StringUtils {
  static truncateAddress = (address: string, type: 'eth' | 'oasis' = 'eth') => {
    const matches = address.match(type === 'oasis' ? truncateOasisRegex : truncateEthRegex)
    if (!matches || matches?.length <= 0) return address

    const [, start, end] = matches
    return `${start}\u2026${end}`
  }

  static getAccountUrl = (baseUrl: string, address: string) => `${baseUrl}/address/${address}`

  static clsx = (...classNames: (string | undefined)[]) => {
    return classNames
      .map(className => (className ? [className] : []))
      .flat()
      .join(' ')
  }

  static getNetworkFriendlyName = (chainName: string) => {
    return NETWORK_NAMES[chainName] ?? 'Unknown network'
  }

  static truncate = (s: string, sliceIndex = 200) => {
    return s.slice(0, sliceIndex)
  }
}
