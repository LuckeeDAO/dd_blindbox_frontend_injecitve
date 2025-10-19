export interface BlindBox {
  id: number;
  name: string;
  description: string;
  price: {
    denom: string;
    amount: string;
  };
  total_supply: number;
  sold_count: number;
  max_per_user: number;
  start_time?: string;
  end_time?: string;
  nft_collection: string;
  rarity_config: RarityConfig[];
  status: BlindBoxStatus;
  created_at: string;
  updated_at: string;
}

export interface RarityConfig {
  rarity: string;
  probability: number;
  nft_ids: string[];
}

export enum BlindBoxStatus {
  Active = 'Active',
  Paused = 'Paused',
  SoldOut = 'SoldOut',
  Ended = 'Ended',
  Settled = 'Settled',
}

export interface Purchase {
  id: number;
  user: string;
  blind_box_id: number;
  quantity: number;
  total_price: {
    denom: string;
    amount: string;
  };
  user_random?: string;
  status: PurchaseStatus;
  created_at: string;
  opened_at?: string;
  nft_tokens: string[];
}

export enum PurchaseStatus {
  Pending = 'Pending',
  Opened = 'Opened',
  Failed = 'Failed',
}

export interface BlindBoxStats {
  blind_box_id: number;
  total_sold: number;
  total_revenue: {
    denom: string;
    amount: string;
  };
  unique_buyers: number;
  nft_distribution: NftDistribution[];
}

export interface NftDistribution {
  rarity: string;
  count: number;
  probability: number;
}

export interface UserStats {
  user: string;
  total_purchases: number;
  total_spent: {
    denom: string;
    amount: string;
  };
  unique_blind_boxes: number;
  nft_count: number;
}

export interface Config {
  admin: string;
  fee_collector: string;
  fee_rate: number;
  paused: boolean;
}

export interface WalletInfo {
  address: string;
  balance: string;
  connected: boolean;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}
