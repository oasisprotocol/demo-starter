import detectEthereumProvider from '@metamask/detect-provider';
import * as sapphire from '@oasisprotocol/sapphire-paratime';
import {
  BrowserProvider,
  type Eip1193Provider,
  JsonRpcProvider,
  JsonRpcSigner,
  type Provider,
  type Signer,
  toBeHex,
} from 'ethers';
import { defineStore } from 'pinia';
import { markRaw, type Raw, ref, shallowRef } from 'vue';
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

  FromConfig = parseInt(import.meta.env.VITE_NETWORK),
}

export enum ConnectionStatus {
  Unknown,
  Disconnected,
  Connected,
}

function networkByChainId(chainId: number | bigint | string): Network {
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

declare global {
  interface Window {
    ethereum: BrowserProvider & Eip1193Provider & sapphire.SapphireAnnex;
  }
}

export const useEthereumStore = defineStore('ethereum', () => {
  const provider = shallowRef<Provider>(
    new JsonRpcProvider(import.meta.env.VITE_WEB3_GATEWAY, undefined, {
      staticNetwork: true,
    }),
  );
  const unwrappedProvider = shallowRef<Provider>(
    new JsonRpcProvider(import.meta.env.VITE_WEB3_GATEWAY, undefined, {
      staticNetwork: true,
    }),
  );

  const signer = shallowRef<Signer | BrowserProvider | Raw<object>>();
  const unwrappedSigner = shallowRef<Signer>();

  const network = ref(Network.FromConfig);
  const address = ref<string | undefined>(undefined);
  const status = ref(ConnectionStatus.Unknown);

  async function getEthereumProvider() {
    const ethProvider = await detectEthereumProvider();

    if (!window.ethereum || ethProvider === null) {
      throw new MetaMaskNotInstalledError('MetaMask not installed!');
    }

    return ethProvider as unknown as typeof window.ethereum;
  }

  async function init(addr: string, eth: Eip1193Provider) {
    const browserProvider = new BrowserProvider(eth);

    const providerNetwork = await browserProvider.getNetwork();
    const chainId = networkByChainId(providerNetwork.chainId);

    const isSapphire = sapphire.NETWORKS[chainId];

    let sapphireSigner: ReturnType<typeof sapphire.wrap>;

    if (isSapphire) {
      const signer = await browserProvider.getSigner();
      sapphireSigner = sapphire.wrap<JsonRpcSigner>(signer);
    }

    signer.value = isSapphire ? markRaw(sapphireSigner!) : await browserProvider.getSigner();

    unwrappedSigner.value = await browserProvider.getSigner(addr);
    provider.value = isSapphire
      ? markRaw(sapphire.wrap(browserProvider.provider))
      : browserProvider.provider;
    unwrappedProvider.value = browserProvider.provider;
    network.value = chainId;
    address.value = addr;
  }

  const connect = async () => {
    const eth = await getEthereumProvider();

    const accounts: string[] = (await (eth.request?.({
      method: 'eth_accounts',
    }) || Promise.resolve([]))) as string[];

    if (!accounts || accounts?.length <= 0) {
      throw new Error('[useEthereumStore] Request account failed!');
    }

    await init(accounts[0], eth as unknown as Eip1193Provider);

    eth.on('accountsChanged', (accountsChanged: string[]) => {
      init(accountsChanged[0], eth as unknown as Eip1193Provider);
    });
    eth.on('chainChanged', () => {
      window.location.reload();
    });
    eth.on('connect', () => (status.value = ConnectionStatus.Connected));
    eth.on('disconnect', () => (status.value = ConnectionStatus.Disconnected));
  };

  async function checkIsCorrectNetwork() {
    return network.value.toString() === Network.FromConfig.toString();
  }

  async function addNetwork(network: Network = Network.FromConfig) {
    const eth = window.ethereum!;

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
    const eth = window.ethereum!;
    if (!eth || !provider.value) return;
    const { chainId: currentNetwork } = await provider.value!.getNetwork();
    if (network == Number(currentNetwork)) return;
    try {
      const chainId = toBeHex(network).replace('0x0', '0x');

      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (e: any) {
      // Metamask desktop - Throws e.code 4902 when chain is not available
      // Metamask mobile - Throws generic -32603 (https://github.com/MetaMask/metamask-mobile/issues/3312)
      if (e?.code !== 4902 && e?.code !== -32603) {
        throw e;
      } else {
        addNetwork(network);
      }
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
