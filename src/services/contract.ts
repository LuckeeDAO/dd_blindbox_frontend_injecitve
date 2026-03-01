import {
  BlindBox,
  Purchase,
  BlindBoxStats,
  UserStats,
  Config,
  PurchaseStatus,
  NumbersInputStatus,
  Warehouse,
  WarehousesResponse,
  RegisterNftRequest,
  CreateAndRegisterNftRequest,
  InputPrizeNumbersRequest,
  PurchaseNumbersResponse,
  BlindBoxStatus,
} from '@/types';
import { walletService } from '@/services/wallet';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { getCurrentChain } from '@/stores/chain';
import { isCosmosChain, isEvmChain } from '@/config/chains';
import { BlindBoxInfoV2, contractServiceV2 } from '@/services/contractV2';

export class ContractService {
  private readonlyClients: Map<string, CosmWasmClient> = new Map();

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

  private toAtomicAmount(value: number | string, decimals: number): string {
    const normalized = String(value).trim();
    if (!/^\d+(\.\d+)?$/.test(normalized)) {
      return '0';
    }

    const [intPart, fracPart = ''] = normalized.split('.');
    const paddedFraction = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
    const base = BigInt(10) ** BigInt(decimals);
    const intAtomic = BigInt(intPart || '0') * base;
    const fracAtomic = BigInt(paddedFraction || '0');
    return (intAtomic + fracAtomic).toString();
  }

  private async buildCommitmentHash(seed?: string): Promise<string> {
    const source = seed?.trim() || `${Date.now()}-${Math.random()}`;
    try {
      if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
        const data = new TextEncoder().encode(source);
        const hash = await globalThis.crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    } catch (error) {
      console.warn('buildCommitmentHash fallback:', error);
    }

    const fallback = Array.from(source)
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
    return (fallback + fallback).padEnd(64, '0').slice(0, 64);
  }

  private mapBlindBoxV2ToLegacy(box: BlindBoxInfoV2): BlindBox {
    return {
      id: box.id,
      period: box.period,
      name: box.name,
      description: box.description,
      price: box.price,
      total_supply: box.total_supply,
      sold_count: box.sold_count,
      max_per_user: box.total_supply,
      nft_collection: box.nft_contract,
      status: box.status as BlindBoxStatus,
      created_at: box.created_at,
      updated_at: box.created_at,
    };
  }

  /**
   * 获取只读查询客户端 (仅 Cosmos)
   */
  private async getReadonlyClient(): Promise<CosmWasmClient> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) {
      throw new Error(`${chain.name} 不支持 CosmWasm 只读客户端`);
    }

    if (!this.readonlyClients.has(chain.key)) {
      try {
        const client = await CosmWasmClient.connect(chain.rpcUrl);
        this.readonlyClients.set(chain.key, client);
        console.log('✅ 只读客户端连接成功:', chain.rpcUrl);
      } catch (error) {
        console.error('❌ 只读客户端连接失败:', error);
        throw new Error('无法连接到区块链网络，请检查网络连接');
      }
    }

    return this.readonlyClients.get(chain.key)!;
  }

  private async ensureConnected(): Promise<void> {
    if (!walletService.isConnected()) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
  }

  /**
   * 查询所有盲盒 (使用只读客户端，不需要钱包)
   */
  async getBlindBoxes(): Promise<BlindBox[]> {
    const chain = this.getActiveChain();

    if (isEvmChain(chain)) {
      try {
        const currentSale = await contractServiceV2.queryCurrentSale();
        if (!currentSale) {
          return [];
        }
        return [this.mapBlindBoxV2ToLegacy(currentSale)];
      } catch (error) {
        console.error('❌ EVM 获取盲盒数据失败:', error);
        return [];
      }
    }

    if (!isCosmosChain(chain)) {
      return [];
    }

    try {
      const queryClient = await this.getReadonlyClient();
      const contractAddress = this.getContractAddress();

      console.log('🔍 查询合约盲盒数据:', contractAddress);

      let response;
      try {
        response = await queryClient.queryContractSmart(contractAddress, {
          all_boxes: { start_after: null, limit: null },
        });
      } catch {
        try {
          response = await queryClient.queryContractSmart(contractAddress, {
            all_boxes: {},
          });
        } catch {
          response = await queryClient.queryContractSmart(contractAddress, {
            history_boxes: {},
          });
        }
      }

      if (!response) {
        return [];
      }

      if (Array.isArray(response)) {
        return response as BlindBox[];
      }

      if (Array.isArray((response as { blind_boxes?: unknown[] }).blind_boxes)) {
        return (response as { blind_boxes: BlindBox[] }).blind_boxes;
      }

      if (Array.isArray((response as { boxes?: unknown[] }).boxes)) {
        return (response as { boxes: BlindBox[] }).boxes;
      }

      if (Array.isArray((response as { data?: unknown[] }).data)) {
        return (response as { data: BlindBox[] }).data;
      }

      return [];
    } catch (error) {
      console.error('❌ 获取盲盒数据失败:', error);
      return [];
    }
  }

  async getBlindBox(id: number): Promise<BlindBox | null> {
    try {
      const blindBoxes = await this.getBlindBoxes();
      return blindBoxes.find((box) => box.id === id || box.period === id) || null;
    } catch (error) {
      console.error('Failed to get blind box:', error);
      return null;
    }
  }

  async purchaseBlindBox(
    _blindBoxId: number,
    _quantity: number,
    _userAddress: string,
  ): Promise<string> {
    try {
      return `0x${Math.random().toString(16).slice(2, 66)}`;
    } catch (error) {
      console.error('Failed to purchase blind box:', error);
      throw error;
    }
  }

  async buyBlindBox(
    blindBoxId: number,
    quantity: number,
    userRandom?: string,
    preferredNfts?: string[],
  ): Promise<{ success: boolean; txHash?: string; error?: string; purchaseId?: number }> {
    try {
      await this.ensureConnected();
      const chain = this.getActiveChain();

      if (isCosmosChain(chain)) {
        const signingClient = walletService.getSigningClient();
        const msg = {
          buy_blind_box: {
            blind_box_id: blindBoxId,
            quantity,
            user_random: userRandom,
            preferred_nfts: preferredNfts,
          },
        };

        const result = await signingClient.execute(
          walletService.getAddress(),
          this.getContractAddress(),
          msg,
          'auto',
          'Buying blind box',
        );

        return {
          success: true,
          txHash: result.transactionHash,
          purchaseId: Math.floor(Math.random() * 1000) + 1,
        };
      }

      if (isEvmChain(chain)) {
        const targetBlindBox = await this.getBlindBox(blindBoxId);
        const period = targetBlindBox?.period || blindBoxId;
        const selectedToken = chain.paymentTokens[0] || chain.nativeToken;
        const paymentToken = selectedToken.id;
        const atomicPrice = this.toAtomicAmount(selectedToken.price, selectedToken.decimals);
        const totalAmount = (BigInt(atomicPrice || '0') * BigInt(quantity)).toString();
        const randomHash = await this.buildCommitmentHash(userRandom);

        const txHash = await contractServiceV2.buyBlindBox(
          period,
          quantity,
          paymentToken,
          randomHash,
          [
            {
              denom: selectedToken.denom,
              amount: totalAmount,
            },
          ],
        );

        return {
          success: true,
          txHash,
          purchaseId: period,
        };
      }

      return {
        success: false,
        error: `${chain.name} 暂未开放购买流程`,
      };
    } catch (error) {
      console.error('Failed to buy blind box:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async openBlindBox(_purchaseId: number, _userAddress: string): Promise<string[]> {
    try {
      const nftIds = ['1', '2', '3', '4', '5', '6'];
      const result = [];
      for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i += 1) {
        result.push(nftIds[Math.floor(Math.random() * nftIds.length)]);
      }
      return result;
    } catch (error) {
      console.error('Failed to open blind box:', error);
      throw error;
    }
  }

  async getUserPurchases(userAddress: string): Promise<Purchase[]> {
    try {
      const chain = this.getActiveChain();
      return [
        {
          id: 1,
          user: userAddress,
          blind_box_id: 1,
          quantity: 2,
          total_price: {
            denom: chain.nativeToken.denom,
            amount: (
              BigInt(10) ** BigInt(chain.nativeToken.decimals) *
              BigInt(4)
            ).toString(),
          },
          first_prize_numbers: [42],
          second_prize_numbers: [
            1, 5, 12, 23, 34, 45, 56, 67, 78, 89, 2, 6, 13, 24, 35, 46, 57, 68, 79, 90, 3,
            7, 14, 25, 36, 47, 58, 69, 80, 91, 4, 8, 15, 26, 37, 48, 59, 70, 81, 92, 9, 16,
            27, 38, 49, 60, 71, 82, 93, 10, 17, 28, 39, 50, 61, 72, 83, 94, 11, 18, 29, 40,
            51, 62, 73, 84, 95, 19, 20, 21, 22, 30, 31, 32, 33, 41, 43, 44, 52, 53, 54, 55,
            63, 64, 65, 66, 74, 75, 76, 77, 85, 86, 87, 88, 96, 97, 98, 99,
          ],
          numbers_input_status: NumbersInputStatus.Validated,
          status: PurchaseStatus.Opened,
          created_at: '2025-10-01T00:00:00Z',
          nft_tokens: ['1', '3'],
        },
      ];
    } catch (error) {
      console.error('Failed to get user purchases:', error);
      return [];
    }
  }

  /**
   * 查询盲盒统计数据 (使用只读客户端，不需要钱包)
   */
  async getBlindBoxStats(blindBoxId: number): Promise<BlindBoxStats | null> {
    const chain = this.getActiveChain();

    if (isEvmChain(chain)) {
      const box = await this.getBlindBox(blindBoxId);
      if (!box) return null;

      return {
        blind_box_id: blindBoxId,
        total_sold: box.sold_count,
        total_revenue: {
          denom: box.price.denom,
          amount: (BigInt(box.price.amount || '0') * BigInt(box.sold_count)).toString(),
        },
        unique_buyers: box.sold_count,
        nft_distribution: [],
      };
    }

    if (!isCosmosChain(chain)) {
      return null;
    }

    try {
      const queryClient = await this.getReadonlyClient();
      const response = await queryClient.queryContractSmart(this.getContractAddress(), {
        blind_box_stats: { blind_box_id: blindBoxId },
      });

      return response;
    } catch (error) {
      console.error('❌ 获取盲盒统计失败:', error);
      throw new Error('无法获取盲盒统计数据');
    }
  }

  async getUserStats(userAddress: string): Promise<UserStats | null> {
    try {
      const chain = this.getActiveChain();
      return {
        user: userAddress,
        total_purchases: 3,
        total_spent: {
          denom: chain.nativeToken.denom,
          amount: (
            BigInt(10) ** BigInt(chain.nativeToken.decimals) *
            BigInt(6)
          ).toString(),
        },
        unique_blind_boxes: 2,
        nft_count: 5,
      };
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return null;
    }
  }

  async getConfig(): Promise<Config | null> {
    try {
      const chain = this.getActiveChain();
      const primaryToken = chain.paymentTokens[0] || chain.nativeToken;
      const secondaryToken = chain.paymentTokens[1] || primaryToken;
      return {
        admin: `${chain.key}_admin_placeholder`,
        fee_collector: `${chain.key}_fee_collector_placeholder`,
        fee_rate: 0.05,
        paused: false,
        usdt_price: this.toAtomicAmount(primaryToken.price, primaryToken.decimals),
        luckee_price: this.toAtomicAmount(secondaryToken.price, secondaryToken.decimals),
        usdt_denom: primaryToken.denom,
        luckee_denom: secondaryToken.denom,
      };
    } catch (error) {
      console.error('Failed to get config:', error);
      return null;
    }
  }

  /**
   * 查询仓库数据 (使用只读客户端，不需要钱包)
   */
  async getWarehouses(): Promise<Warehouse[]> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) {
      return [];
    }

    try {
      const queryClient = await this.getReadonlyClient();
      const response: WarehousesResponse = await queryClient.queryContractSmart(
        this.getContractAddress(),
        {
          warehouses: {},
        },
      );

      return response.warehouses || [];
    } catch (error) {
      console.error('❌ 获取仓库数据失败:', error);
      throw new Error('无法获取仓库数据');
    }
  }

  async registerNft(
    request: RegisterNftRequest,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const chain = this.getActiveChain();
      if (!isCosmosChain(chain)) {
        return {
          success: false,
          error: `${chain.name} 暂不支持该管理操作`,
        };
      }

      await this.ensureConnected();
      const signingClient = walletService.getSigningClient();
      const msg = {
        register_nft: {
          nft_id: request.nft_id,
          contract_address: request.contract_address,
          warehouse_id: request.warehouse_id,
          guarantee_price: request.guarantee_price,
        },
      };

      const result = await signingClient.execute(
        walletService.getAddress(),
        this.getContractAddress(),
        msg,
        'auto',
        'Registering NFT to warehouse',
      );

      return {
        success: true,
        txHash: result.transactionHash,
      };
    } catch (error) {
      console.error('Failed to register NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async createAndRegisterNft(
    request: CreateAndRegisterNftRequest,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const chain = this.getActiveChain();
      if (!isCosmosChain(chain)) {
        return {
          success: false,
          error: `${chain.name} 暂不支持该管理操作`,
        };
      }

      await this.ensureConnected();
      const signingClient = walletService.getSigningClient();
      const msg = {
        create_and_register_nft: {
          nft_id: request.nft_id,
          contract_address: request.contract_address,
          warehouse_id: request.warehouse_id,
          guarantee_price: request.guarantee_price,
          metadata: request.metadata,
        },
      };

      const result = await signingClient.execute(
        walletService.getAddress(),
        this.getContractAddress(),
        msg,
        'auto',
        'Creating and registering NFT to warehouse',
      );

      return {
        success: true,
        txHash: result.transactionHash,
      };
    } catch (error) {
      console.error('Failed to create and register NFT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async inputPrizeNumbers(
    request: InputPrizeNumbersRequest,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const chain = this.getActiveChain();
      if (!isCosmosChain(chain)) {
        return {
          success: false,
          error: `${chain.name} 暂不支持号码输入`,
        };
      }

      await this.ensureConnected();
      const signingClient = walletService.getSigningClient();
      const msg = {
        input_prize_numbers: {
          purchase_id: request.purchase_id,
          first_prize_numbers: request.first_prize_numbers,
          second_prize_numbers: request.second_prize_numbers,
        },
      };

      const result = await signingClient.execute(
        walletService.getAddress(),
        this.getContractAddress(),
        msg,
        'auto',
        'Inputting prize numbers',
      );

      return {
        success: true,
        txHash: result.transactionHash,
      };
    } catch (error) {
      console.error('Failed to input prize numbers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validatePrizeNumbers(
    purchaseId: number,
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const chain = this.getActiveChain();
      if (!isCosmosChain(chain)) {
        return {
          success: false,
          error: `${chain.name} 暂不支持号码校验`,
        };
      }

      await this.ensureConnected();
      const signingClient = walletService.getSigningClient();
      const msg = {
        validate_prize_numbers: {
          purchase_id: purchaseId,
        },
      };

      const result = await signingClient.execute(
        walletService.getAddress(),
        this.getContractAddress(),
        msg,
        'auto',
        'Validating prize numbers',
      );

      return {
        success: true,
        txHash: result.transactionHash,
      };
    } catch (error) {
      console.error('Failed to validate prize numbers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 查询购买号码 (使用只读客户端，不需要钱包)
   */
  async getPurchaseNumbers(purchaseId: number): Promise<PurchaseNumbersResponse | null> {
    const chain = this.getActiveChain();
    if (!isCosmosChain(chain)) {
      return null;
    }

    try {
      const queryClient = await this.getReadonlyClient();
      const response = await queryClient.queryContractSmart(this.getContractAddress(), {
        purchase_numbers: { purchase_id: purchaseId },
      });
      return response;
    } catch (error) {
      console.error('❌ 获取购买号码失败:', error);
      throw new Error('无法获取购买号码');
    }
  }
}

export const contractService = new ContractService();
