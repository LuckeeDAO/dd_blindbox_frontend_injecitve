export interface BlindBox {
  id: number;
  period: number;
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
  status: BlindBoxStatus;
  created_at: string;
  updated_at: string;
}

export enum BlindBoxStatus {
  Preparing = 'Preparing',
  Packaged = 'Packaged',
  Revealed = 'Revealed',
  Rewarded = 'Rewarded',
  AfterSale = 'AfterSale',
  Completed = 'Completed',
  Paused = 'Paused',
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
  preferred_nfts?: string[];  // 用户偏好的NFT ID列表
  first_prize_numbers: number[];  // 一等奖随机数列表（用户输入）
  second_prize_numbers: number[];  // 二等奖随机数列表（用户输入，最多99个）
  numbers_input_status: NumbersInputStatus;  // 随机数输入状态
  status: PurchaseStatus;
  created_at: string;
  nft_tokens: string[];
}

export enum NumbersInputStatus {
  NotInput = 'NotInput',
  Input = 'Input',
  Validating = 'Validating',
  Validated = 'Validated',
}

export enum PurchaseStatus {
  Wait = 'Wait',
  Ordered = 'Ordered',
  Paying = 'Paying',
  Paid = 'Paid',
  Opened = 'Opened',
  PaymentFailed = 'PaymentFailed',
  OpenFailed = 'OpenFailed',
  Cancelled = 'Cancelled',
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
  usdt_price: string;      // USDT 单价（微单位）
  luckee_price: string;    // LUCKEE 单价（微单位）
  usdt_denom: string;      // USDT 代币标识
  luckee_denom: string;    // LUCKEE 代币标识
}

export interface WalletInfo {
  address: string;
  balance: string;
  connected: boolean;
}

// 支付代币类型
export interface PaymentToken {
  id: string;           // "usdt" 或 "luckee"
  name: string;         // "USDT" 或 "LUCKEE"
  denom: string;        // 代币标识
  price: number;        // 单个盲盒价格
  decimals: number;     // 小数位数
  icon?: string;        // 图标路径
}

// 支持的支付代币列表
export const PAYMENT_TOKENS: PaymentToken[] = [
  {
    id: 'usdt',
    name: 'USDT',
    denom: 'usdt',
    price: 2,
    decimals: 6,
    icon: '/tokens/usdt.svg'
  },
  {
    id: 'luckee',
    name: 'LUCKEE',
    denom: 'luckee',
    price: 4,
    decimals: 6,
    icon: '/tokens/luckee.svg'
  }
];

// NFT 信息结构
export interface NftInfo {
  id: string;
  contract_address: string;
  guarantee_price: string;
  owner: string;
  registered_at: string;
  status: string;
}

// 仓库信息结构
export interface Warehouse {
  id: string;
  name: string;
  price_multiplier: number;
  probability: number;
  max_capacity: number;
  current_capacity: number;
  nft_list: NftInfo[];
  current_index: number;
  status: string;
}

// 仓库响应结构
export interface WarehousesResponse {
  warehouses: Warehouse[];
}

// NFT 入仓请求
export interface RegisterNftRequest {
  nft_id: string;
  contract_address: string;
  warehouse_id: string;
  guarantee_price: string;
}

// 创建并注册 NFT 请求
export interface CreateAndRegisterNftRequest {
  nft_id: string;
  contract_address: string;
  warehouse_id: string;
  guarantee_price: string;
  metadata?: string;
}

export interface InputPrizeNumbersRequest {
  purchase_id: number;
  first_prize_numbers: number[];
  second_prize_numbers: number[];
}

export interface PurchaseNumbersResponse {
  purchase_id: number;
  first_prize_numbers: number[];
  second_prize_numbers: number[];
  numbers_input_status: NumbersInputStatus;
  is_valid: boolean;
  validation_errors: string[];
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  purchaseId?: number;
}
