import detectEthereumProvider from '@metamask/detect-provider';
import * as sapphire from '@oasisprotocol/sapphire-paratime';
import {
  BrowserProvider,
  hexlify,
  JsonRpcProvider,
  JsonRpcSigner,
  type Provider
} from 'ethers';
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

  FromConfig = Number(BigInt(import.meta.env.VITE_NETWORK)),
}

export enum ConnectionStatus {
  Unknown,
  Disconnected,
  Connected,
}

function networkFromChainId(chainId: number | bigint | string): Network {
  const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
  if (Network[Number(id)]) return id as Network;
  return Network.Unknown;
}

const networkNameMap: Record<Network, string> = {
  [Network.Local]: 'Local Network',
  [Network.EmeraldTestnet]: 'Emerald Testnet',
  [Network.EmeraldMainnet]: 'Emerald Mainnet',
  [Network.SapphireTestnet]: 'Sapphire Testnet',
  [Network.SapphireMainnet]: 'Sapphire Mainnet',
  [Network.SapphireLocalnet]: 'Sapphire Localnet',
  [Network.BscMainnet]: 'BSC',
  [Network.BscTestnet]: 'BSC Testnet',
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
      BrowserProvider & {
      request(args: RequestArguments): Promise<unknown>;
    } & { networkVersion: string };
  }
}

export const useEthereumStore = defineStore('ethereum', () => {
  const signer = shallowRef<JsonRpcSigner | undefined>(undefined);
  const unwrappedSigner = shallowRef<JsonRpcSigner | undefined>(undefined);
  const provider = shallowRef<Provider>(
    new JsonRpcProvider(import.meta.env.VITE_WEB3_GATEWAY, 'any'),
  );
  const unwrappedProvider = shallowRef<JsonRpcProvider>(
    new JsonRpcProvider(import.meta.env.VITE_WEB3_GATEWAY, 'any'),
  );
  const network = ref(Network.FromConfig);
  const address = ref<string | undefined>(undefined);
  const status = ref(ConnectionStatus.Unknown);

  async function getEthereumProvider() {
    const ethProvider = await detectEthereumProvider();

    if (!window.ethereum || ethProvider === null) {
      throw new MetaMaskNotInstalledError('MetaMask not installed!');
    }

    return {ethProvider: window.ethereum, isMetaMask: ethProvider.isMetaMask};
  }

  async function connect() {
    if (signer.value) return;

    const {ethProvider, isMetaMask} = await getEthereumProvider();

    const s = await new BrowserProvider(ethProvider).getSigner();
    await s.provider.send('eth_requestAccounts', []);

    const setSigner = (addr: string | undefined, net: Network) => {
      if (!net) return;
      const isSapphire = sapphire.NETWORKS[net as number];
      signer.value = isSapphire ? sapphire.wrap(s) : s;
      unwrappedSigner.value = s;
      provider.value = isSapphire ? markRaw(sapphire.wrap(s.provider)) : s.provider;
      unwrappedProvider.value = s.provider as JsonRpcProvider;
      network.value = net;
      address.value = addr;
    };

    const [addr, net] = await Promise.all([
      s.getAddress(),
      s.provider.getNetwork().then(net => networkFromChainId(net.chainId)),
    ]);
    setSigner(addr, net);

    if (!isMetaMask) {
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

  function checkIsCorrectNetwork() {
    return window.ethereum.networkVersion.toString() === Network.FromConfig.toString();
  }

  async function addNetwork(network: Network = Network.FromConfig) {
    const eth = window.ethereum;

    if (network == Network.SapphireTestnet) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x5aff',
            chainName: 'Sapphire Testnet',
            nativeCurrency: { name: 'TEST', symbol: 'TEST', decimals: 18 },
            rpcUrls: ['https://testnet.sapphire.oasis.dev/', 'wss://testnet.sapphire.oasis.dev/ws'],
            blockExplorerUrls: ['https://explorer.stg.oasis.io/testnet/sapphire'],
          },
        ],
      });
    } else if (network === Network.SapphireMainnet) {
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
    } else if (network === Network.SapphireLocalnet) {
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
    }
  }

  async function switchNetwork(network: Network) {
    const eth = window.ethereum;
    if (!eth || !provider.value) return;
    const { chainId: currentNetwork} = await provider.value.getNetwork();
    if (network == Number(currentNetwork)) return;
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexlify(network.toString(16)).replace('0x0', '0x') }],
      });
    } catch (e: any) {
      // This error code indicates that the chain has not been added to MetaMask.
      if ((e as any).code !== 4902) throw e;
      addNetwork(network);
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
    checkIsCorrectNetwork,
    addNetwork,
    switchNetwork,
  };
});
