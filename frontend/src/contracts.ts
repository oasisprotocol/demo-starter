import type { ComputedRef } from 'vue';
import { computed } from 'vue';

import { type MessageBox, MessageBox__factory } from '@oasisprotocol/demo-starter-backend';
export type { MessageBox } from '@oasisprotocol/demo-starter-backend';

import { useEthereumStore } from './stores/ethereum';
import { type ContractRunner, VoidSigner } from 'ethers';

const addr = import.meta.env.VITE_MESSAGE_BOX_ADDR!;

export function useMessageBox(): ComputedRef<MessageBox | null> {
  const eth = useEthereumStore();

  return computed(() => {
    if (!eth) {
      console.error('[useMessageBox] Ethereum Store not initialized');
      return null;
    }

    if (!eth.signer) {
      console.error('[useMessageBox] Signer is not initialized');
      return null;
    }

    return MessageBox__factory.connect(addr, eth.signer as ContractRunner);
  });
}

function initializeSigner(eth: ReturnType<typeof useEthereumStore>) {
  let signer = eth.unwrappedSigner;
  if (!signer && eth.unwrappedProvider) {
    signer = new VoidSigner(eth.address!, eth.unwrappedProvider);
  }
  return signer;
}

export function useUnwrappedMessageBox(): ComputedRef<MessageBox | null> {
  const eth = useEthereumStore();
  return computed(() => {
    if (!eth) {
      console.error('[useMessageBox] Ethereum Store not initialized');
      return null;
    }

    const signer = initializeSigner(eth);
    if (!signer) {
      console.error('[useMessageBox] Signer not initialized');
      return null;
    }

    return MessageBox__factory.connect(addr, signer);
  });
}
