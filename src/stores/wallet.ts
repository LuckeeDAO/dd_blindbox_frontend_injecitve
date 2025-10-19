import { create } from 'zustand';
import { WalletInfo } from '@/types';
import { walletService } from '@/services/wallet';

interface WalletStore {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  error: string | null;
  
  connect: (mnemonic: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallet: null,
  isConnecting: false,
  error: null,

  connect: async (mnemonic: string) => {
    set({ isConnecting: true, error: null });
    
    try {
      const walletInfo = await walletService.connectWallet(mnemonic);
      set({ wallet: walletInfo, isConnecting: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      set({ error: errorMessage, isConnecting: false });
      throw error;
    }
  },

  disconnect: async () => {
    try {
      await walletService.disconnectWallet();
      set({ wallet: null, error: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet';
      set({ error: errorMessage });
    }
  },

  refreshBalance: async () => {
    const { wallet } = get();
    if (!wallet) return;

    try {
      const balance = await walletService.getBalance(wallet.address);
      set({
        wallet: {
          ...wallet,
          balance
        }
      });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));
