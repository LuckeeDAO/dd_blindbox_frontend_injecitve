import { listChains, getChainConfig } from '@/config/chains';
import { useChainStore } from '@/stores/chain';

export function useChain() {
  const chainKey = useChainStore((state) => state.chainKey);
  const setChainKey = useChainStore((state) => state.setChainKey);

  const chain = getChainConfig(chainKey);
  const availableChains = listChains();

  return {
    chain,
    chainKey,
    setChainKey,
    availableChains,
  };
}
