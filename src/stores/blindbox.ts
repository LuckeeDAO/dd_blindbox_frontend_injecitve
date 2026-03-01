import { create } from 'zustand';
import { BlindBox, Purchase } from '@/types';
import { contractService } from '@/services/contract';

interface BlindBoxStore {
  blindBoxes: BlindBox[];
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
  
  fetchBlindBoxes: () => Promise<void>;
  fetchPurchases: (user: string) => Promise<void>;
  purchaseBlindBox: (blindBoxId: number, quantity: number, user: string) => Promise<string>;
  openBlindBox: (purchaseId: number, user: string) => Promise<string[]>;
  setError: (error: string | null) => void;
}

export const useBlindBoxStore = create<BlindBoxStore>((set, get) => ({
  blindBoxes: [],
  purchases: [],
  isLoading: false,
  error: null,

  fetchBlindBoxes: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const blindBoxes = await contractService.getBlindBoxes();
      set({ blindBoxes, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch blind boxes';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchPurchases: async (user: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const purchases = await contractService.getUserPurchases(user);
      set({ purchases, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch purchases';
      set({ error: errorMessage, isLoading: false });
    }
  },

  purchaseBlindBox: async (blindBoxId: number, quantity: number, user: string) => {
    try {
      const txHash = await contractService.purchaseBlindBox(blindBoxId, quantity, user);
      // 刷新购买记录
      await get().fetchPurchases(user);
      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to purchase blind box';
      set({ error: errorMessage });
      throw error;
    }
  },

  openBlindBox: async (purchaseId: number, user: string) => {
    try {
      const nftTokens = await contractService.openBlindBox(purchaseId, user);
      // 刷新购买记录
      await get().fetchPurchases(user);
      return nftTokens;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open blind box';
      set({ error: errorMessage });
      throw error;
    }
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));
