import { useCallback, useEffect } from 'react';
import { useWalletStore } from '../stores/wallet';
import { WalletType } from '../types/wallet';
import toast from 'react-hot-toast';
import { walletService } from '@/services/wallet';
import { useChain } from '@/hooks/useChain';
import { isEvmChain } from '@/config/chains';

function formatBalance(rawAmount: string, decimals: number): string {
  try {
    const value = BigInt(rawAmount);
    const base = BigInt(10) ** BigInt(decimals);
    const integer = value / base;
    const fraction = value % base;
    const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');

    if (!fractionStr) {
      return integer.toString();
    }

    return `${integer.toString()}.${fractionStr.slice(0, 4)}`;
  } catch {
    return rawAmount;
  }
}

export const useWallet = () => {
  const { chain, chainKey } = useChain();
  const { wallet, connect, disconnect, updateBalance, setError } = useWalletStore();

  const address = wallet?.address;
  const walletType = wallet?.type;
  const balance = wallet?.balance;
  const isConnected = !!wallet?.connected;

  const updateWalletBalance = useCallback(
    async (targetAddress: string) => {
      try {
        const chainDenom = chain.nativeToken.denom;
        const result = await walletService.getBalance(targetAddress, chainDenom);
        const formatted = formatBalance(result.amount, chain.nativeToken.decimals);
        updateBalance(formatted);
      } catch (error) {
        console.error('获取余额失败:', error);
      }
    },
    [chain.nativeToken.decimals, chain.nativeToken.denom, updateBalance],
  );

  const connectWallet = useCallback(
    async (targetWalletType: WalletType): Promise<string | null> => {
      try {
        await walletService.setChain(chainKey);
        const walletInfo = await walletService.connect(targetWalletType);

        await connect(walletInfo);
        await updateWalletBalance(walletInfo.address);

        toast.success(`${chain.name} 钱包连接成功`);
        return walletInfo.address;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '连接钱包失败';
        setError(errorMessage);
        toast.error(errorMessage);
        throw error;
      }
    },
    [chain.name, chainKey, connect, setError, updateWalletBalance],
  );

  const disconnectWallet = useCallback(async () => {
    await walletService.disconnect();
    await disconnect();
    toast.success('钱包已断开连接');
  }, [disconnect]);

  const refreshWalletBalance = useCallback(async () => {
    if (address) {
      await updateWalletBalance(address);
    }
  }, [address, updateWalletBalance]);

  useEffect(() => {
    if (!isEvmChain(chain) || !isConnected) {
      return;
    }

    let provider: ReturnType<typeof walletService.getEvmProvider> | null = null;
    try {
      provider = walletService.getEvmProvider();
    } catch {
      return;
    }

    const handleAccountsChanged = async (accounts: unknown) => {
      const accountList = accounts as string[];
      if (!accountList || accountList.length === 0) {
        await disconnectWallet();
        return;
      }

      if (address && accountList[0].toLowerCase() !== address.toLowerCase()) {
        window.location.reload();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [address, chain, disconnectWallet, isConnected]);

  return {
    address,
    isConnected,
    walletType,
    balance,
    chain,
    connect: connectWallet,
    disconnect: disconnectWallet,
    refreshBalance: refreshWalletBalance,
  };
};
