import { ethers } from 'ethers';
import type { ComputedRef } from 'vue';
import { computed } from 'vue';

import { type MessageBox, MessageBox__factory } from '@oasisprotocol/demo-starter-backend';
export type { MessageBox } from '@oasisprotocol/demo-starter-backend';
import { type Gasless, Gasless__factory } from '@oasisprotocol/demo-starter-backend';
export type { Gasless } from '@oasisprotocol/demo-starter-backend';

import { useEthereumStore } from './stores/ethereum';

const provider = new ethers.providers.JsonRpcProvider(
  import.meta.env.VITE_WEB3_GATEWAY,
  'any',
);

export const staticMessageBox = MessageBox__factory.connect(import.meta.env.VITE_MESSAGE_BOX_ADDR!, provider);

export function useMessageBox(): ComputedRef<MessageBox> {
  const eth = useEthereumStore();
  const addr = import.meta.env.VITE_MESSAGE_BOX_ADDR!;
  return computed(() => {
    return MessageBox__factory.connect(addr, eth.signer ?? eth.provider);
  });
}

export function useUnwrappedMessageBox(): ComputedRef<MessageBox> {
  const eth = useEthereumStore();
  const addr = import.meta.env.VITE_MESSAGE_BOX_ADDR!;
  return computed(() => {
    return MessageBox__factory.connect(addr, eth.unwrappedSigner ?? eth.unwrappedProvider);
  });
}

export function useGasless(): ComputedRef<Gasless> {
  const eth = useEthereumStore();
  const addr = import.meta.env.VITE_GASLESS_ADDR!;
  return computed(() => {
    return Gasless__factory.connect(addr, eth.signer ?? eth.provider);
  });
}
