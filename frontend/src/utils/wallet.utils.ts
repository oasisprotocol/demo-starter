export const isMetaMaskInjected = () =>
  typeof window !== 'undefined' ? window.ethereum?.isMetaMask === true : false
