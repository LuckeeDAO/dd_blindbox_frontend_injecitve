import { walletService } from './wallet';
import { BlindBox, Purchase, BlindBoxStats, UserStats, Config } from '@/types';

export class ContractService {
  private readonly contractAddress: string;

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  // 查询配置
  async getConfig(): Promise<Config> {
    const result = await walletService.queryContract(this.contractAddress, {
      config: {}
    });
    return result as unknown as Config;
  }

  // 查询盲盒
  async getBlindBox(blindBoxId: number): Promise<BlindBox> {
    const result = await walletService.queryContract(this.contractAddress, {
      blind_box: { blind_box_id: blindBoxId }
    });
    return result.blind_box as unknown as BlindBox;
  }

  // 查询所有盲盒
  async getBlindBoxes(startAfter?: number, limit?: number): Promise<BlindBox[]> {
    const result = await walletService.queryContract(this.contractAddress, {
      blind_boxes: { start_after: startAfter, limit }
    });
    return result.blind_boxes as unknown as BlindBox[];
  }

  // 查询购买记录
  async getPurchase(purchaseId: number): Promise<Purchase> {
    const result = await walletService.queryContract(this.contractAddress, {
      purchase: { purchase_id: purchaseId }
    });
    return result.purchase as unknown as Purchase;
  }

  // 查询用户购买记录
  async getPurchases(
    user?: string,
    blindBoxId?: number,
    startAfter?: number,
    limit?: number
  ): Promise<Purchase[]> {
    const result = await walletService.queryContract(this.contractAddress, {
      purchases: { user, blind_box_id: blindBoxId, start_after: startAfter, limit }
    });
    return result.purchases as unknown as Purchase[];
  }

  // 查询盲盒统计
  async getBlindBoxStats(blindBoxId: number): Promise<BlindBoxStats> {
    const result = await walletService.queryContract(this.contractAddress, {
      blind_box_stats: { blind_box_id: blindBoxId }
    });
    return result as unknown as BlindBoxStats;
  }

  // 查询用户统计
  async getUserStats(user: string): Promise<UserStats> {
    const result = await walletService.queryContract(this.contractAddress, {
      user_stats: { user }
    });
    return result as unknown as UserStats;
  }

  // 购买盲盒
  async buyBlindBox(
    blindBoxId: number,
    quantity: number,
    userRandom?: string
  ): Promise<string> {
    const blindBox = await this.getBlindBox(blindBoxId);
    const totalAmount = (parseInt(blindBox.price.amount) * quantity).toString();

    const msg = {
      buy_blind_box: {
        blind_box_id: blindBoxId,
        quantity,
        user_random: userRandom
      }
    };

    const funds = [{
      denom: blindBox.price.denom,
      amount: totalAmount
    }];

    return await walletService.executeContract(this.contractAddress, msg, funds);
  }

  // 开盲盒
  async openBlindBox(
    purchaseId: number,
    userRandom?: string
  ): Promise<string> {
    const msg = {
      open_blind_box: {
        purchase_id: purchaseId,
        user_random: userRandom
      }
    };

    return await walletService.executeContract(this.contractAddress, msg);
  }

  // 创建盲盒（管理员）
  async createBlindBox(
    name: string,
    description: string,
    price: { denom: string; amount: string },
    totalSupply: number,
    maxPerUser: number,
    nftCollection: string,
    rarityConfig: Array<{
      rarity: string;
      probability: number;
      nft_ids: string[];
    }>,
    startTime?: string,
    endTime?: string
  ): Promise<string> {
    const msg = {
      create_blind_box: {
        name,
        description,
        price,
        total_supply: totalSupply,
        max_per_user: maxPerUser,
        start_time: startTime,
        end_time: endTime,
        nft_collection: nftCollection,
        rarity_config: rarityConfig
      }
    };

    return await walletService.executeContract(this.contractAddress, msg);
  }

  // 更新盲盒（管理员）
  async updateBlindBox(
    blindBoxId: number,
    updates: {
      name?: string;
      description?: string;
      price?: { denom: string; amount: string };
      total_supply?: number;
      max_per_user?: number;
      start_time?: string;
      end_time?: string;
      rarity_config?: Array<{
        rarity: string;
        probability: number;
        nft_ids: string[];
      }>;
    }
  ): Promise<string> {
    const msg = {
      update_blind_box: {
        blind_box_id: blindBoxId,
        ...updates
      }
    };

    return await walletService.executeContract(this.contractAddress, msg);
  }

  // 结算盲盒（管理员）
  async settleBlindBox(blindBoxId: number): Promise<string> {
    const msg = {
      settle_blind_box: {
        blind_box_id: blindBoxId
      }
    };

    return await walletService.executeContract(this.contractAddress, msg);
  }

  // 紧急提取（管理员）
  async emergencyWithdraw(blindBoxId: number): Promise<string> {
    const msg = {
      emergency_withdraw: {
        blind_box_id: blindBoxId
      }
    };

    return await walletService.executeContract(this.contractAddress, msg);
  }
}

export const contractService = new ContractService(
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''
);
