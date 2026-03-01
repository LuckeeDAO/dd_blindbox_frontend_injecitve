import { create } from 'zustand';
import { DEFAULT_CHAIN_KEY, getChainConfig, CHAIN_REGISTRY } from '@/config/chains';

const FALLBACK_CHAIN_KEY = Object.keys(CHAIN_REGISTRY)[0] || 'avalanche_fuji';

interface ChainStore {
  chainKey: string;
  setChainKey: (chainKey: string) => void;
}

export const useChainStore = create<ChainStore>((set) => ({
  chainKey: CHAIN_REGISTRY[DEFAULT_CHAIN_KEY] ? DEFAULT_CHAIN_KEY : FALLBACK_CHAIN_KEY,
  setChainKey: (chainKey: string) => {
    set({
      chainKey: CHAIN_REGISTRY[chainKey]
        ? chainKey
        : CHAIN_REGISTRY[DEFAULT_CHAIN_KEY]
          ? DEFAULT_CHAIN_KEY
          : FALLBACK_CHAIN_KEY,
    });
  },
}));

export function getCurrentChain() {
  return getChainConfig(useChainStore.getState().chainKey);
}
