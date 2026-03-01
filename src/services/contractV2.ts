/**
 * 合约服务 V2.0
 * 承诺-揭秘机制（多链适配）
 */

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { BrowserProvider, Contract, JsonRpcProvider } from 'ethers';
import { walletService } from '@/services/wallet';
import { getCurrentChain } from '@/stores/chain';
import { isCosmosChain, isEvmChain } from '@/config/chains';
import { sanitizePurchaseTokensBeforePublish } from '@/services/v2LifecycleGuard';

// ==================== V2.0 类型定义 ====================

export interface BlindBoxInfoV2 {
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
  participants_count: number;
  first_prize_count: number;
  second_prize_count: number;
  third_prize_count: number;
  nft_contract: string;
  status: BlindBoxStatusV2;
  created_at: string;
  sold_out_height: number | null;
  revealed_at_height: number | null;
  is_default_random: boolean;
  after_sale_start_height: number | null;
  completed_at_height: number | null;
}

export type BlindBoxStatusV2 =
  | 'Preparing'
  | 'Packaged'
  | 'Revealed'
  | 'Rewarded'
  | 'AfterSale'
  | 'Completed'
  | 'Paused';

export interface PurchaseInfoV2 {
  id: number;
  user: string;
  blind_box_id: number;
  period: number;
  quantity: number;
  total_price: {
    denom: string;
    amount: string;
  };
  random_hash: string;
  random_value: string | null;
  revealed_at: string | null;
  prize_level: number | null;
  nft_tokens: string[];
  purchased_at: string;
}

export interface RevealProgressResponse {
  total_participants: number;
  revealed_count: number;
  reveal_percentage: number;
  is_timeout: boolean;
  timeout_height: number | null;
}

export interface UnrevealedUsersResponse {
  users: string[];
  count: number;
}

export interface UserRevealStatusResponse {
  has_purchased: boolean;
  has_revealed: boolean;
  random_hash: string | null;
  revealed_at: string | null;
}

export interface BoxParticipantsResponse {
  participants: string[];
  count: number;
}

export interface ConfigResponseV2 {
  admin: string;
  fee_collector: string;
  fee_rate: number;
  paused: boolean;
  reveal_max_blocks: number;
  after_sale_blocks: number;
}

// ==================== V2.0 执行消息 ====================

export interface BuyBlindBoxMsgV2 {
  buy_blind_box: {
    period: number;
    quantity: number;
    payment_token: string;
    random_hash: string;
  };
}

export interface RevealMyCommitmentMsg {
  reveal_my_commitment: {
    period: number;
    random_value: string;
  };
}

export interface TriggerStateTransitionMsg {
  trigger_state_transition: {
    period: number;
  };
}

const DEFAULT_EVM_ABI = [
  'function currentSale() view returns (tuple(uint256 id,uint256 period,string name,string description,string priceDenom,uint256 priceAmount,uint256 totalSupply,uint256 soldCount,uint256 participantsCount,uint256 firstPrizeCount,uint256 secondPrizeCount,uint256 thirdPrizeCount,string nftContract,uint8 status,uint256 createdAt,uint256 soldOutHeight,uint256 revealedAtHeight,bool isDefaultRandom,uint256 afterSaleStartHeight,uint256 completedAtHeight))',
  'function blindBoxByPeriod(uint256 period) view returns (tuple(uint256 id,uint256 period,string name,string description,string priceDenom,uint256 priceAmount,uint256 totalSupply,uint256 soldCount,uint256 participantsCount,uint256 firstPrizeCount,uint256 secondPrizeCount,uint256 thirdPrizeCount,string nftContract,uint8 status,uint256 createdAt,uint256 soldOutHeight,uint256 revealedAtHeight,bool isDefaultRandom,uint256 afterSaleStartHeight,uint256 completedAtHeight))',
  'function revealProgress(uint256 period) view returns (uint256 totalParticipants,uint256 revealedCount,uint256 revealPercentage,bool isTimeout,uint256 timeoutHeight)',
  'function userRevealStatus(uint256 period,address user) view returns (bool hasPurchased,bool hasRevealed,string randomHash,uint256 revealedAt)',
  'function buyBlindBox(uint256 period,uint256 quantity,string paymentToken,string randomHash) payable',
  'function revealMyCommitment(uint256 period,string randomValue)',
  'function triggerStateTransition(uint256 period)',
] as const;

const STATUS_MAP: BlindBoxStatusV2[] = [
  'Preparing',
  'Packaged',
  'Revealed',
  'Rewarded',
  'AfterSale',
  'Completed',
  'Paused',
];

function toNum(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  try {
    if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    }
    if (typeof value === 'object' && 'toString' in (value as object)) {
      const n = Number((value as { toString: () => string }).toString());
      return Number.isFinite(n) ? n : fallback;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function toStr(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return fallback;
}

function toNullableNumber(value: unknown): number | null {
  const num = toNum(value, 0);
  return num > 0 ? num : null;
}

function normalizeBlindBox(raw: unknown, fallbackDenom: string): BlindBoxInfoV2 {
  const item = (raw || {}) as Record<string, unknown>;

  const statusRaw = toNum(item.status, 0);
  const status = STATUS_MAP[statusRaw] || 'Preparing';

  const period = toNum(item.period, 0);
  const id = toNum(item.id, period);

  const priceDenom =
    toStr(item.priceDenom) ||
    toStr(item.price_denom) ||
    toStr((item.price as Record<string, unknown> | undefined)?.denom) ||
    fallbackDenom;

  const priceAmountRaw =
    item.priceAmount ??
    item.price_amount ??
    (item.price as Record<string, unknown> | undefined)?.amount ??
    0;

  return {
    id,
    period,
    name: toStr(item.name, `Blind Box #${id}`),
    description: toStr(item.description, ''),
    price: {
      denom: priceDenom,
      amount: toStr(priceAmountRaw, '0'),
    },
    total_supply: toNum(item.totalSupply ?? item.total_supply, 0),
    sold_count: toNum(item.soldCount ?? item.sold_count, 0),
    participants_count: toNum(item.participantsCount ?? item.participants_count, 0),
    first_prize_count: toNum(item.firstPrizeCount ?? item.first_prize_count, 0),
    second_prize_count: toNum(item.secondPrizeCount ?? item.second_prize_count, 0),
    third_prize_count: toNum(item.thirdPrizeCount ?? item.third_prize_count, 0),
    nft_contract: toStr(item.nftContract ?? item.nft_contract, ''),
    status,
    created_at: new Date(toNum(item.createdAt ?? item.created_at, Date.now())).toISOString(),
    sold_out_height: toNullableNumber(item.soldOutHeight ?? item.sold_out_height),
    revealed_at_height: toNullableNumber(item.revealedAtHeight ?? item.revealed_at_height),
    is_default_random: Boolean(item.isDefaultRandom ?? item.is_default_random),
    after_sale_start_height: toNullableNumber(
      item.afterSaleStartHeight ?? item.after_sale_start_height,
    ),
    completed_at_height: toNullableNumber(item.completedAtHeight ?? item.completed_at_height),
  };
}

function parseEnvJsonArray(value?: string): unknown[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

// ==================== V2.0 合约服务类 ====================

export class ContractServiceV2 {
  private readonlyClients: Map<string, CosmWasmClient> = new Map();
  private readonlyEvmProviders: Map<string, JsonRpcProvider> = new Map();

  private getActiveChain() {
    return getCurrentChain();
  }

  private getContractAddress(): string {
    const chain = this.getActiveChain();
    if (chain.contractAddress) return chain.contractAddress;

    if (isCosmosChain(chain)) {
      return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
    }

    if (isEvmChain(chain)) {
      return process.env.NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS || '';
    }

    return '';
  }

  private ensureContractAddress(): string {
    const address = this.getContractAddress();
    if (!address) {
      throw new Error('当前链未配置合约地址，请检查环境变量');
    }
    return address;
  }

  private getEvmAbi(): readonly string[] {
    const fromEnv = parseEnvJsonArray(process.env.NEXT_PUBLIC_AVALANCHE_ABI);
    if (!fromEnv) return DEFAULT_EVM_ABI;

    return fromEnv.filter((item): item is string => typeof item === 'string');
  }

  private async getReadonlyClient(): Promise<CosmWasmClient> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) {
      throw new Error(`${chain.name} 暂未实现 CosmWasm 查询客户端`);
    }

    if (!this.readonlyClients.has(chain.key)) {
      const client = await CosmWasmClient.connect(chain.rpcUrl);
      this.readonlyClients.set(chain.key, client);
      console.log(`✅ 只读客户端连接成功: ${chain.name} (${chain.rpcUrl})`);
    }

    return this.readonlyClients.get(chain.key)!;
  }

  private getReadonlyEvmProvider(): JsonRpcProvider {
    const chain = this.getActiveChain();
    if (!isEvmChain(chain)) {
      throw new Error('当前链不是 EVM 网络');
    }

    if (!this.readonlyEvmProviders.has(chain.key)) {
      this.readonlyEvmProviders.set(chain.key, new JsonRpcProvider(chain.rpcUrl));
    }

    return this.readonlyEvmProviders.get(chain.key)!;
  }

  private getReadonlyEvmContract(): Contract {
    const address = this.ensureContractAddress();
    const provider = this.getReadonlyEvmProvider();
    return new Contract(address, this.getEvmAbi(), provider);
  }

  private async getWritableEvmContract(): Promise<Contract> {
    const address = this.ensureContractAddress();
    const provider = walletService.getEvmProvider();
    const browserProvider = new BrowserProvider(provider as any);
    const signer = await browserProvider.getSigner();
    return new Contract(address, this.getEvmAbi(), signer);
  }

  private resolveMethod(contract: Contract, methods: string[]): string {
    for (const method of methods) {
      if (typeof (contract as Record<string, unknown>)[method] === 'function') {
        return method;
      }
    }

    throw new Error(`未找到可用方法: ${methods.join(', ')}`);
  }

  private async sanitizePurchaseByPeriodStatus(
    purchase: PurchaseInfoV2,
  ): Promise<PurchaseInfoV2> {
    try {
      const box = await this.queryBlindBoxByPeriod(purchase.period);
      return sanitizePurchaseTokensBeforePublish(purchase, box.status);
    } catch {
      // 无法查询状态时按“未公布”保守处理，避免提前暴露 tokenId
      return sanitizePurchaseTokensBeforePublish(purchase, 'Revealed');
    }
  }

  // ==================== 查询方法 ====================

  async queryConfig(): Promise<ConfigResponseV2> {
    const chain = this.getActiveChain();

    if (isCosmosChain(chain)) {
      const client = await this.getReadonlyClient();
      const contractAddress = this.ensureContractAddress();
      return await client.queryContractSmart(contractAddress, { config: {} });
    }

    if (isEvmChain(chain)) {
      return {
        admin: '',
        fee_collector: '',
        fee_rate: 0,
        paused: false,
        reveal_max_blocks: 0,
        after_sale_blocks: 0,
      };
    }

    throw new Error('Solana 配置查询尚未实现');
  }

  async queryCurrentSale(): Promise<BlindBoxInfoV2 | null> {
    const chain = this.getActiveChain();

    if (isCosmosChain(chain)) {
      const client = await this.getReadonlyClient();
      const contractAddress = this.ensureContractAddress();
      const response = await client.queryContractSmart(contractAddress, { current_sale: {} });
      return response.blind_box || null;
    }

    if (isEvmChain(chain)) {
      const contract = this.getReadonlyEvmContract();
      const method = this.resolveMethod(contract, [
        process.env.NEXT_PUBLIC_EVM_METHOD_CURRENT_SALE || 'currentSale',
        'getCurrentSale',
        'queryCurrentSale',
      ]);
      const raw = await (contract as Record<string, (...args: unknown[]) => Promise<unknown>>)[
        method
      ]();
      if (!raw) return null;
      return normalizeBlindBox(raw, chain.nativeToken.symbol);
    }

    return null;
  }

  async queryBlindBoxByPeriod(period: number): Promise<BlindBoxInfoV2> {
    const chain = this.getActiveChain();

    if (isCosmosChain(chain)) {
      const client = await this.getReadonlyClient();
      const contractAddress = this.ensureContractAddress();
      const response = await client.queryContractSmart(contractAddress, {
        blind_box_by_period: { period },
      });
      return response.blind_box;
    }

    if (isEvmChain(chain)) {
      const contract = this.getReadonlyEvmContract();
      const method = this.resolveMethod(contract, [
        process.env.NEXT_PUBLIC_EVM_METHOD_BOX_BY_PERIOD || 'blindBoxByPeriod',
        'getBlindBoxByPeriod',
        'queryBlindBoxByPeriod',
      ]);
      const raw = await (contract as Record<string, (...args: unknown[]) => Promise<unknown>>)[
        method
      ](period);
      return normalizeBlindBox(raw, chain.nativeToken.symbol);
    }

    throw new Error('Solana 盲盒查询尚未实现');
  }

  async queryBlindBoxById(id: number): Promise<BlindBoxInfoV2> {
    const chain = this.getActiveChain();

    if (!isCosmosChain(chain)) {
      throw new Error('当前链未实现 blind_box_by_id 查询');
    }

    const client = await this.getReadonlyClient();
    const contractAddress = this.ensureContractAddress();
    const response = await client.queryContractSmart(contractAddress, {
      blind_box_by_id: { id },
    });
    return response.blind_box;
  }

  async queryHistoryBoxes(
    status?: BlindBoxStatusV2,
    startAfter?: number,
    limit?: number,
  ): Promise<BlindBoxInfoV2[]> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) return [];

    const client = await this.getReadonlyClient();
    const contractAddress = this.ensureContractAddress();
    const response = await client.queryContractSmart(contractAddress, {
      history_boxes: {
        status: status || null,
        start_after: startAfter || null,
        limit: limit || null,
      },
    });
    return response.boxes || [];
  }

  async queryAllBoxes(startAfter?: number, limit?: number): Promise<BlindBoxInfoV2[]> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) return [];

    const client = await this.getReadonlyClient();
    const contractAddress = this.ensureContractAddress();
    const response = await client.queryContractSmart(contractAddress, {
      all_boxes: {
        start_after: startAfter || null,
        limit: limit || null,
      },
    });
    return response.boxes || [];
  }

  async queryRevealProgress(period: number): Promise<RevealProgressResponse> {
    const chain = this.getActiveChain();

    if (isCosmosChain(chain)) {
      const client = await this.getReadonlyClient();
      const contractAddress = this.ensureContractAddress();
      return await client.queryContractSmart(contractAddress, {
        reveal_progress: { period },
      });
    }

    if (isEvmChain(chain)) {
      const contract = this.getReadonlyEvmContract();
      const method = this.resolveMethod(contract, [
        process.env.NEXT_PUBLIC_EVM_METHOD_REVEAL_PROGRESS || 'revealProgress',
        'getRevealProgress',
      ]);
      const raw = await (contract as Record<string, (...args: unknown[]) => Promise<unknown>>)[
        method
      ](period);

      const item = raw as Record<string, unknown>;
      return {
        total_participants: toNum(item.totalParticipants ?? item.total_participants, 0),
        revealed_count: toNum(item.revealedCount ?? item.revealed_count, 0),
        reveal_percentage: toNum(item.revealPercentage ?? item.reveal_percentage, 0),
        is_timeout: Boolean(item.isTimeout ?? item.is_timeout),
        timeout_height: toNullableNumber(item.timeoutHeight ?? item.timeout_height),
      };
    }

    throw new Error('Solana 揭示进度查询尚未实现');
  }

  async queryUnrevealedUsers(period: number, limit?: number): Promise<UnrevealedUsersResponse> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) {
      return { users: [], count: 0 };
    }

    const client = await this.getReadonlyClient();
    const contractAddress = this.ensureContractAddress();
    return await client.queryContractSmart(contractAddress, {
      unrevealed_users: {
        period,
        limit: limit || null,
      },
    });
  }

  async queryUserRevealStatus(period: number, user: string): Promise<UserRevealStatusResponse> {
    const chain = this.getActiveChain();

    if (isCosmosChain(chain)) {
      const client = await this.getReadonlyClient();
      const contractAddress = this.ensureContractAddress();
      return await client.queryContractSmart(contractAddress, {
        user_reveal_status: {
          period,
          user,
        },
      });
    }

    if (isEvmChain(chain)) {
      const contract = this.getReadonlyEvmContract();
      const method = this.resolveMethod(contract, [
        process.env.NEXT_PUBLIC_EVM_METHOD_USER_REVEAL_STATUS || 'userRevealStatus',
        'getUserRevealStatus',
      ]);
      const raw = await (contract as Record<string, (...args: unknown[]) => Promise<unknown>>)[
        method
      ](period, user);
      const item = raw as Record<string, unknown>;

      return {
        has_purchased: Boolean(item.hasPurchased ?? item.has_purchased),
        has_revealed: Boolean(item.hasRevealed ?? item.has_revealed),
        random_hash: toStr(item.randomHash ?? item.random_hash, null as unknown as string),
        revealed_at: toNullableNumber(item.revealedAt ?? item.revealed_at)?.toString() || null,
      };
    }

    throw new Error('Solana 用户揭示状态查询尚未实现');
  }

  async queryBoxParticipants(
    period: number,
    startAfter?: string,
    limit?: number,
  ): Promise<BoxParticipantsResponse> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) {
      return { participants: [], count: 0 };
    }

    const client = await this.getReadonlyClient();
    const contractAddress = this.ensureContractAddress();
    return await client.queryContractSmart(contractAddress, {
      box_participants: {
        period,
        start_after: startAfter || null,
        limit: limit || null,
      },
    });
  }

  async queryPurchase(id: number): Promise<PurchaseInfoV2> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) {
      throw new Error('当前链未实现 purchase 查询');
    }

    const client = await this.getReadonlyClient();
    const contractAddress = this.ensureContractAddress();
    const response = await client.queryContractSmart(contractAddress, {
      purchase: { id },
    });
    return this.sanitizePurchaseByPeriodStatus(response.purchase);
  }

  async queryUserPurchases(
    user: string,
    period?: number,
    startAfter?: number,
    limit?: number,
  ): Promise<PurchaseInfoV2[]> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) return [];

    const client = await this.getReadonlyClient();
    const contractAddress = this.ensureContractAddress();
    const response = await client.queryContractSmart(contractAddress, {
      user_purchases: {
        user,
        period: period || null,
        start_after: startAfter || null,
        limit: limit || null,
      },
    });
    const purchases: PurchaseInfoV2[] = response.purchases || [];
    return Promise.all(purchases.map((item) => this.sanitizePurchaseByPeriodStatus(item)));
  }

  // ==================== 执行方法 ====================

  async buyBlindBox(
    period: number,
    quantity: number,
    paymentToken: string,
    randomHash: string,
    funds: { denom: string; amount: string }[],
  ): Promise<string> {
    if (!walletService.isConnected()) {
      throw new Error('请先连接钱包');
    }

    const chain = this.getActiveChain();

    if (isCosmosChain(chain)) {
      const msg: BuyBlindBoxMsgV2 = {
        buy_blind_box: {
          period,
          quantity,
          payment_token: paymentToken,
          random_hash: randomHash,
        },
      };

      const result = await walletService.executeContract(
        this.ensureContractAddress(),
        (msg as unknown) as Record<string, unknown>,
        'auto',
        undefined,
        funds,
      );

      return result.transactionHash;
    }

    if (isEvmChain(chain)) {
      const contract = await this.getWritableEvmContract();
      const method = this.resolveMethod(contract, [
        process.env.NEXT_PUBLIC_EVM_METHOD_BUY || 'buyBlindBox',
        'buy',
      ]);

      const nativeFund = funds.find((f) => f.denom.toUpperCase() === chain.nativeToken.symbol);
      const overrides = nativeFund ? { value: BigInt(nativeFund.amount) } : {};

      const call =
        (contract as unknown as Record<string, (...args: unknown[]) => Promise<{ hash: string }>>)[
          method
        ];

      try {
        const tx = await call(period, quantity, paymentToken, randomHash, overrides);
        return tx.hash;
      } catch {
        try {
          const tx = await call(period, quantity, paymentToken, overrides);
          return tx.hash;
        } catch {
          const tx = await call(period, quantity, overrides);
          return tx.hash;
        }
      }
    }

    throw new Error('Solana 购买交易尚未实现');
  }

  async revealMyCommitment(period: number, randomValue: string): Promise<string> {
    if (!walletService.isConnected()) {
      throw new Error('请先连接钱包');
    }

    const chain = this.getActiveChain();

    if (isCosmosChain(chain)) {
      const msg: RevealMyCommitmentMsg = {
        reveal_my_commitment: {
          period,
          random_value: randomValue,
        },
      };

      const result = await walletService.executeContract(
        this.ensureContractAddress(),
        (msg as unknown) as Record<string, unknown>,
        'auto',
      );

      return result.transactionHash;
    }

    if (isEvmChain(chain)) {
      const contract = await this.getWritableEvmContract();
      const method = this.resolveMethod(contract, [
        process.env.NEXT_PUBLIC_EVM_METHOD_REVEAL || 'revealMyCommitment',
        'revealCommitment',
        'reveal',
      ]);
      const call =
        (contract as unknown as Record<string, (...args: unknown[]) => Promise<{ hash: string }>>)[
          method
        ];

      try {
        const tx = await call(period, randomValue);
        return tx.hash;
      } catch {
        const tx = await call(period);
        return tx.hash;
      }
    }

    throw new Error('Solana 揭示交易尚未实现');
  }

  async triggerStateTransition(period: number): Promise<string> {
    if (!walletService.isConnected()) {
      throw new Error('请先连接钱包');
    }

    const chain = this.getActiveChain();

    if (isCosmosChain(chain)) {
      const msg: TriggerStateTransitionMsg = {
        trigger_state_transition: {
          period,
        },
      };

      const result = await walletService.executeContract(
        this.ensureContractAddress(),
        (msg as unknown) as Record<string, unknown>,
        'auto',
      );

      return result.transactionHash;
    }

    if (isEvmChain(chain)) {
      const contract = await this.getWritableEvmContract();
      const method = this.resolveMethod(contract, [
        process.env.NEXT_PUBLIC_EVM_METHOD_TRIGGER || 'triggerStateTransition',
        'trigger',
      ]);
      const tx = await (
        contract as unknown as Record<string, (...args: unknown[]) => Promise<{ hash: string }>>
      )[method](period);
      return tx.hash;
    }

    throw new Error('Solana 状态触发交易尚未实现');
  }
}

export const contractServiceV2 = new ContractServiceV2();
