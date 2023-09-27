import detectEthereumProvider from '@metamask/detect-provider';
import * as sapphire from '@oasisprotocol/sapphire-paratime';
import { BigNumber, ethers } from 'ethers';
import { defineStore } from 'pinia';
import { markRaw, ref, shallowRef } from 'vue';
import { MetaMaskNotInstalledError } from '@/utils/errors';

export enum Network {
  Unknown = 0,
  Ethereum = 1,
  Goerli = 10,
  BscMainnet = 56,
  BscTestnet = 97,
  EmeraldTestnet = 0xa515,
  EmeraldMainnet = 0xa516,
  SapphireTestnet = 0x5aff,
  SapphireMainnet = 0x5afe,
  SapphireLocalnet = 0x5afd,
  Local = 1337,

  FromConfig = BigNumber.from(import.meta.env.VITE_NETWORK).toNumber(),
}

export enum ConnectionStatus {
  Unknown,
  Disconnected,
  Connected,
}

function networkFromChainId(chainId: number | string): Network {
  const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
  if (Network[id]) return id as Network;
  return Network.Unknown;
}

const networkNameMap: Record<Network, string> = {
  [Network.Local]: 'Local Network',
  [Network.EmeraldTestnet]: 'Emerald Testnet',
  [Network.EmeraldMainnet]: 'Emerald Mainnet',
  [Network.SapphireTestnet]: 'Sapphire Testnet',
  [Network.SapphireMainnet]: 'Sapphire Mainnet',
  [Network.SapphireLocalnet]: 'Sapphire Localnet',
};

export function networkName(network?: Network): string {
  if (network && networkNameMap[network]) {
    return networkNameMap[network];
  }
  return 'Unknown Network';
}

interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

declare global {
  interface Window {
    ethereum: Awaited<ReturnType<typeof detectEthereumProvider>> &
      ethers.providers.Web3Provider & {
        request(args: RequestArguments): Promise<unknown>;
      };
  }
}

export const useEthereumStore = defineStore('ethereum', () => {
  const signer = shallowRef<ethers.providers.JsonRpcSigner | undefined>(undefined);
  const unwrappedSigner = shallowRef<ethers.providers.JsonRpcSigner | undefined>(undefined);
  const provider = shallowRef<ethers.providers.Provider>(
    new ethers.providers.JsonRpcProvider(import.meta.env.VITE_WEB3_GATEWAY, 'any'),
  );
  const unwrappedProvider = shallowRef<ethers.providers.JsonRpcProvider>(
    new ethers.providers.JsonRpcProvider(import.meta.env.VITE_WEB3_GATEWAY, 'any'),
  );
  const network = ref(Network.FromConfig);
  const address = ref<string | undefined>(undefined);
  const status = ref(ConnectionStatus.Unknown);

  async function getEthereumProvider() {
    const ethProvider = await detectEthereumProvider();

    if (!window.ethereum || ethProvider !== window.ethereum) {
      throw new MetaMaskNotInstalledError('MetaMask not installed!');
    }

    return ethProvider;
  }

  async function connect() {
    if (signer.value) return;

    const ethProvider = await getEthereumProvider();

    const s = new ethers.providers.Web3Provider(ethProvider).getSigner();
    await s.provider.send('eth_requestAccounts', []);

    const setSigner = (addr: string | undefined, net: Network) => {
      if (!net) return;
      const isSapphire = sapphire.NETWORKS[net as number];
      signer.value = isSapphire ? sapphire.wrap(s) : s;
      unwrappedSigner.value = s;
      provider.value = isSapphire ? markRaw(sapphire.wrap(s.provider)) : s.provider;
      unwrappedProvider.value = s.provider;
      network.value = net;
      address.value = addr;
    };

    const [addr, net] = await Promise.all([
      s.getAddress(),
      s.getChainId().then(networkFromChainId),
    ]);
    setSigner(addr, net);

    if (!ethProvider.isMetaMask) {
      status.value = ConnectionStatus.Connected;
      return;
    }
    ethProvider.on('accountsChanged', (accounts) => {
      setSigner(accounts[0], network.value);
    });
    ethProvider.on('chainChanged', (chainId) => {
      // setSigner(address.value, networkFromChainId(chainId));

      // TODO: Dirty fix, reload the app to ensure the state resets after chain switch
      window.location.reload();
    });
    ethProvider.on('connect', () => (status.value = ConnectionStatus.Connected));
    ethProvider.on('disconnect', () => (status.value = ConnectionStatus.Disconnected));
  }

  async function switchNetwork(network: Network) {
    const eth = window.ethereum;
    if (!eth || !provider.value) return;
    const { chainId: currentNetwork } = await provider.value.getNetwork();
    if (network == currentNetwork) return;
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.utils.hexlify(network).replace('0x0', '0x') }],
      });
    } catch (e: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if ((e as any).code !== 4902) throw e;
      if (network == Network.SapphireTestnet) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x5aff',
                chainName: 'Sapphire Testnet',
                nativeCurrency: { name: 'TEST', symbol: 'TEST', decimals: 18 },
                rpcUrls: [
                  'https://testnet.sapphire.oasis.dev/',
                  'wss://testnet.sapphire.oasis.dev/ws',
                ],
                blockExplorerUrls: ['https://explorer.stg.oasis.io/testnet/sapphire'],
              },
            ],
          });
        } catch (e: any) {
          throw new Error(e);
        }
      } else if (network === Network.SapphireMainnet) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x5afe',
                chainName: 'Sapphire Mainnet',
                nativeCurrency: {
                  name: 'ROSE',
                  symbol: 'ROSE',
                  decimals: 18,
                },
                rpcUrls: ['https://sapphire.oasis.io/', 'wss://sapphire.oasis.io/ws'],
                blockExplorerUrls: ['https://explorer.stg.oasis.io/mainnet/sapphire'],
              },
            ],
          });
        } catch (e: any) {
          throw new Error(e);
        }
      } else if (network === Network.SapphireLocalnet) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x5afd',
                chainName: 'Sapphire Localnet',
                rpcUrls: ['http://localhost:8545'],
              },
            ],
          });
        } catch (e: any) {
          throw new Error(e);
        }
      }
      throw e;
    }
  }

  return {
    unwrappedSigner,
    signer,
    unwrappedProvider,
    provider,
    address,
    network,
    getEthereumProvider,
    connect,
    switchNetwork,
  };
});
