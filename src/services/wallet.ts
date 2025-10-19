import { SigningStargateClient } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { WalletInfo } from '@/types';

export class WalletService {
  private client: SigningStargateClient | null = null;
  private cosmWasmClient: SigningCosmWasmClient | null = null;
  private queryClient: CosmWasmClient | null = null;
  private wallet: DirectSecp256k1HdWallet | null = null;
  private readonly rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://injective-rpc.publicnode.com';
  private readonly chainId = process.env.NEXT_PUBLIC_CHAIN_ID || 'injective-1';

  async connectWallet(mnemonic?: string): Promise<WalletInfo> {
    try {
      if (!mnemonic) {
        throw new Error('Mnemonic is required');
      }

      // 创建钱包
      this.wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: 'inj',
      });

      // 创建客户端
      this.client = await SigningStargateClient.connectWithSigner(
        this.rpcUrl,
        this.wallet
      );

      // 创建CosmWasm客户端
      this.cosmWasmClient = await SigningCosmWasmClient.connectWithSigner(
        this.rpcUrl,
        this.wallet
      );

      // 创建查询客户端
      this.queryClient = await CosmWasmClient.connect(this.rpcUrl);

      // 获取账户信息
      const [account] = await this.wallet.getAccounts();
      const balance = await this.client.getBalance(account.address, 'inj');

      return {
        address: account.address,
        balance: balance.amount,
        connected: true,
      };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.client = null;
    this.cosmWasmClient = null;
    this.queryClient = null;
    this.wallet = null;
  }

  async getBalance(address: string, denom: string = 'inj'): Promise<string> {
    if (!this.client) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.client.getBalance(address, denom);
      return balance.amount;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async sendTokens(
    recipient: string,
    amount: string,
    denom: string = 'inj'
  ): Promise<string> {
    if (!this.client || !this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      
      const result = await this.client.sendTokens(
        account.address,
        recipient,
        [{ denom, amount }],
        'auto'
      );

      return result.transactionHash;
    } catch (error) {
      console.error('Failed to send tokens:', error);
      throw error;
    }
  }

  async executeContract(
    contractAddress: string,
    msg: Record<string, unknown>,
    funds: Array<{ denom: string; amount: string }> = []
  ): Promise<string> {
    if (!this.cosmWasmClient || !this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const [account] = await this.wallet.getAccounts();
      
      const result = await this.cosmWasmClient.execute(
        account.address,
        contractAddress,
        msg,
        'auto',
        undefined,
        funds
      );

      return result.transactionHash;
    } catch (error) {
      console.error('Failed to execute contract:', error);
      throw error;
    }
  }

  async queryContract(contractAddress: string, queryMsg: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.queryClient) {
      throw new Error('Query client not connected');
    }

    try {
      const result = await this.queryClient.queryContractSmart(contractAddress, queryMsg);
      return result;
    } catch (error) {
      console.error('Failed to query contract:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.cosmWasmClient !== null && this.wallet !== null;
  }

  async getAddress(): Promise<string | null> {
    if (!this.wallet) return null;
    const accounts = await this.wallet.getAccounts();
    return accounts[0]?.address || null;
  }
}

export const walletService = new WalletService();
