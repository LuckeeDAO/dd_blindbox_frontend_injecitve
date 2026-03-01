import {
  WalletType,
  WalletInfo,
  AccountInfo,
  Balance,
  Transaction,
  TransactionResult,
} from '@/types/wallet';
import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { OfflineSigner } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/stargate';
import { toast } from 'react-hot-toast';
import { ChainConfig, isCosmosChain, isEvmChain } from '@/config/chains';
import { getCurrentChain, useChainStore } from '@/stores/chain';
import { pickEvmProvider as pickInjectedProvider } from '@/services/evmProvider';

interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, callback: (...args: unknown[]) => void): void;
  removeListener?(event: string, callback: (...args: unknown[]) => void): void;
  isAnDaoWallet?: boolean;
  isMetaMask?: boolean;
  providers?: Eip1193Provider[];
}

export interface WalletService {
  setChain(chainKey: string): Promise<void>;
  getChain(): ChainConfig;
  connect(walletType: WalletType): Promise<WalletInfo>;
  disconnect(): Promise<void>;
  getAccount(): Promise<AccountInfo | null>;
  getAddress(): string;
  getBalance(address: string, denom?: string): Promise<Balance>;
  sendTransaction(tx: Transaction): Promise<TransactionResult>;
  executeContract(
    contractAddress: string,
    msg: Record<string, unknown>,
    fee: 'auto' | StdFee,
    memo?: string,
    funds?: { denom: string; amount: string }[],
  ): Promise<TransactionResult>;
  signMessage(message: string): Promise<string>;
  on(event: string, callback: (...args: unknown[]) => void): void;
  off(event: string, callback: (...args: unknown[]) => void): void;
  isConnected(): boolean;
  getQueryClient(): CosmWasmClient;
  getSigningClient(): SigningCosmWasmClient;
  getEvmProvider(): Eip1193Provider;
}

class WalletServiceImpl implements WalletService {
  private wallet: unknown = null;
  private listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private signingCosmWasmClient: SigningCosmWasmClient | null = null;
  private cosmWasmClient: CosmWasmClient | null = null;
  private currentWalletType: WalletType | null = null;
  private currentAddress: string | null = null;
  private evmProvider: Eip1193Provider | null = null;

  constructor() {
    this.initClients().catch((error) => {
      console.warn('wallet init client skipped:', error);
    });
  }

  async setChain(chainKey: string): Promise<void> {
    useChainStore.getState().setChainKey(chainKey);
    await this.disconnect();
    await this.initClients();
  }

  getChain(): ChainConfig {
    return getCurrentChain();
  }

  private async initClients() {
    const chain = this.getChain();
    if (isCosmosChain(chain)) {
      this.cosmWasmClient = await CosmWasmClient.connect(chain.rpcUrl);
      return;
    }

    this.cosmWasmClient = null;
  }

  async connect(walletType: WalletType): Promise<WalletInfo> {
    const chain = this.getChain();

    if (chain.status === 'planned') {
      throw new Error(`${chain.name} 处于预留阶段，暂未开放钱包连接`);
    }

    if (!chain.wallets.includes(walletType)) {
      throw new Error(`${walletType} 不支持 ${chain.name}`);
    }

    try {
      let walletInfo: WalletInfo;

      if (isCosmosChain(chain)) {
        switch (walletType) {
          case WalletType.KEPLR:
            walletInfo = await this.connectKeplr(chain);
            break;
          case WalletType.COSMOSTATION:
            walletInfo = await this.connectCosmostation(chain);
            break;
          default:
            throw new Error('Unsupported cosmos wallet type');
        }
      } else if (isEvmChain(chain)) {
        if (
          process.env.NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER === 'true' &&
          walletType !== WalletType.ANDAO
        ) {
          throw new Error('当前环境要求使用 AnDaoWallet');
        }

        if (walletType === WalletType.ANDAO) {
          walletInfo = await this.connectAnDaoWallet(chain);
        } else if (walletType === WalletType.METAMASK) {
          walletInfo = await this.connectMetaMask(chain);
        } else {
          throw new Error('Avalanche 当前仅支持 AnDaoWallet / MetaMask');
        }
      } else {
        throw new Error('Solana 适配正在规划中，暂未开放连接');
      }

      this.currentWalletType = walletType;
      this.emit('connected', walletInfo);
      return walletInfo;
    } catch (error: unknown) {
      console.error('Failed to connect wallet:', error);
      const errorMessage = error instanceof Error ? error.message : '连接钱包失败';
      toast.error(errorMessage);
      throw error;
    }
  }

  private async connectKeplr(chain: ChainConfig): Promise<WalletInfo> {
    if (typeof window.keplr === 'undefined') {
      throw new Error('Keplr wallet not found. Please install Keplr extension.');
    }

    const chainId = String(chain.chainId);

    try {
      await (window.keplr as { enable: (chainId: string) => Promise<void> }).enable(chainId);
      this.wallet = window.keplr;
      const key = await (window.keplr as {
        getKey: (
          chainId: string,
        ) => Promise<{ bech32Address: string; pubKey: Uint8Array; algo: string; isNanoLedger: boolean }>;
      }).getKey(chainId);

      const offlineSigner = (this.wallet as {
        getOfflineSigner: (chainId: string) => OfflineSigner;
      }).getOfflineSigner(chainId);
      this.signingCosmWasmClient = await SigningCosmWasmClient.connectWithSigner(
        chain.rpcUrl,
        offlineSigner,
      );

      this.currentAddress = key.bech32Address;
      return {
        type: WalletType.KEPLR,
        chainKey: chain.key,
        address: key.bech32Address,
        pubKey: key.pubKey,
        algo: key.algo,
        isNanoLedger: key.isNanoLedger,
        connected: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('User rejected')) {
        throw new Error('User rejected the connection request.');
      }
      throw new Error(`Failed to enable Keplr wallet: ${errorMessage}`);
    }
  }

  private async connectCosmostation(chain: ChainConfig): Promise<WalletInfo> {
    if (typeof window.cosmostation === 'undefined') {
      throw new Error('Cosmostation wallet not found. Please install Cosmostation extension.');
    }

    const chainId = String(chain.chainId);

    try {
      const result = await (window.cosmostation as {
        cosmos: {
          request: (params: {
            method: string;
            params: { chainName: string };
          }) => Promise<{ address: string }>;
        };
      }).cosmos.request({
        method: 'cos_requestAccount',
        params: { chainName: chainId },
      });

      if (!result || !result.address) {
        throw new Error('Failed to get address from Cosmostation.');
      }

      const offlineSigner = (window.cosmostation as {
        getOfflineSigner: (chainId: string) => OfflineSigner;
      }).getOfflineSigner(chainId);

      this.signingCosmWasmClient = await SigningCosmWasmClient.connectWithSigner(
        chain.rpcUrl,
        offlineSigner,
      );

      this.currentAddress = result.address;

      return {
        type: WalletType.COSMOSTATION,
        chainKey: chain.key,
        address: result.address,
        pubKey: new Uint8Array(),
        algo: 'secp256k1',
        isNanoLedger: false,
        connected: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('User rejected')) {
        throw new Error('User rejected the connection request.');
      }
      throw new Error(`Failed to connect Cosmostation wallet: ${errorMessage}`);
    }
  }

  private async connectMetaMask(chain: ChainConfig): Promise<WalletInfo> {
    const provider = this.pickEvmProvider('metamask');
    if (!provider) {
      throw new Error('MetaMask not found. Please install MetaMask extension.');
    }

    if (chain.evm) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chain.evm.chainHexId }],
        });
      } catch (error) {
        const switchError = error as { code?: number };
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chain.evm.chainHexId,
                chainName: chain.evm.chainName,
                nativeCurrency: chain.evm.nativeCurrency,
                rpcUrls: chain.evm.rpcUrls,
                blockExplorerUrls: chain.evm.blockExplorerUrls,
              },
            ],
          });
        } else {
          throw error;
        }
      }
    }

    const accounts = (await provider.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No account returned from MetaMask');
    }

    this.wallet = provider;
    this.evmProvider = provider;
    this.currentAddress = accounts[0];

    return {
      type: WalletType.METAMASK,
      chainKey: chain.key,
      address: accounts[0],
      pubKey: new Uint8Array(),
      algo: 'ecdsa',
      isNanoLedger: false,
      connected: true,
    };
  }

  private async connectAnDaoWallet(chain: ChainConfig): Promise<WalletInfo> {
    const provider = this.pickEvmProvider('andao');
    if (!provider) {
      throw new Error('AnDaoWallet Provider not found. Please start AnDaoWallet first.');
    }

    if (chain.evm) {
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chain.evm.chainHexId }],
        });
      } catch (error) {
        const switchError = error as { code?: number };
        if (switchError.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chain.evm.chainHexId,
                chainName: chain.evm.chainName,
                nativeCurrency: chain.evm.nativeCurrency,
                rpcUrls: chain.evm.rpcUrls,
                blockExplorerUrls: chain.evm.blockExplorerUrls,
              },
            ],
          });
        } else {
          throw error;
        }
      }
    }

    const accounts = (await provider.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No account returned from AnDaoWallet');
    }

    this.wallet = provider;
    this.evmProvider = provider;
    this.currentAddress = accounts[0];

    return {
      type: WalletType.ANDAO,
      chainKey: chain.key,
      address: accounts[0],
      pubKey: new Uint8Array(),
      algo: 'ecdsa',
      isNanoLedger: false,
      connected: true,
    };
  }

  async disconnect(): Promise<void> {
    this.wallet = null;
    this.signingCosmWasmClient = null;
    this.currentWalletType = null;
    this.currentAddress = null;
    this.evmProvider = null;
    this.emit('disconnected', {});
  }

  getAddress(): string {
    return this.currentAddress || '';
  }

  async getAccount(): Promise<AccountInfo | null> {
    const chain = this.getChain();

    if (!this.wallet || !this.currentWalletType) {
      return null;
    }

    try {
      if (isCosmosChain(chain)) {
        const chainId = String(chain.chainId);

        if (this.currentWalletType === WalletType.KEPLR) {
          const key = await (this.wallet as {
            getKey: (
              chainId: string,
            ) => Promise<{ bech32Address: string; pubKey: Uint8Array; algo: string; isNanoLedger: boolean }>;
          }).getKey(chainId);
          return {
            address: key.bech32Address,
            pubKey: key.pubKey,
            algo: key.algo,
            isNanoLedger: key.isNanoLedger,
          };
        }

        if (this.currentWalletType === WalletType.COSMOSTATION) {
          const result = await (this.wallet as {
            cosmos: {
              request: (params: {
                method: string;
                params: { chainName: string };
              }) => Promise<{ address: string }>;
            };
          }).cosmos.request({
            method: 'cos_requestAccount',
            params: { chainName: chainId },
          });

          return {
            address: result.address,
            pubKey: new Uint8Array(),
            algo: 'secp256k1',
            isNanoLedger: false,
          };
        }

        return null;
      }

      if (isEvmChain(chain) && this.currentAddress) {
        return {
          address: this.currentAddress,
          pubKey: new Uint8Array(),
          algo: 'ecdsa',
          isNanoLedger: false,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get account info:', error);
      return null;
    }
  }

  async getBalance(address: string, denom?: string): Promise<Balance> {
    const chain = this.getChain();

    if (isCosmosChain(chain)) {
      if (!this.cosmWasmClient) {
        this.cosmWasmClient = await CosmWasmClient.connect(chain.rpcUrl);
      }

      const targetDenom = denom || chain.nativeToken.denom;
      const balance = await this.cosmWasmClient.getBalance(address, targetDenom);

      return {
        denom: balance.denom,
        amount: balance.amount,
      };
    }

    if (isEvmChain(chain)) {
      const provider = this.evmProvider || this.pickEvmProviderForCurrentWallet();
      if (!provider) {
        throw new Error('EVM wallet provider not connected');
      }

      const amountHex = (await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })) as string;

      return {
        denom: chain.nativeToken.symbol,
        amount: BigInt(amountHex).toString(),
      };
    }

    throw new Error('Solana balance query is not implemented yet');
  }

  async sendTransaction(tx: Transaction): Promise<TransactionResult> {
    const chain = this.getChain();

    if (!isCosmosChain(chain)) {
      throw new Error('sendTransaction currently supports cosmos only');
    }

    if (!this.signingCosmWasmClient) {
      throw new Error('Signing CosmWasm client not connected');
    }

    const account = await this.getAccount();
    if (!account) {
      throw new Error('Account not found');
    }

    const result = await this.signingCosmWasmClient.signAndBroadcast(
      account.address,
      tx.msgs,
      tx.fee,
      tx.memo,
    );

    return {
      transactionHash: result.transactionHash,
      height: result.height,
      gasUsed: result.gasUsed,
      gasWanted: result.gasWanted,
    };
  }

  async executeContract(
    contractAddress: string,
    msg: Record<string, unknown>,
    fee: 'auto' | StdFee,
    memo?: string,
    funds?: { denom: string; amount: string }[],
  ): Promise<TransactionResult> {
    const chain = this.getChain();

    if (!isCosmosChain(chain)) {
      throw new Error(
        'EVM contract execution requires EVM adapter implementation in contract service',
      );
    }

    if (!this.signingCosmWasmClient) {
      throw new Error('Signing CosmWasm client not connected');
    }

    const account = await this.getAccount();
    if (!account) {
      throw new Error('Account not found');
    }

    const result = await this.signingCosmWasmClient.execute(
      account.address,
      contractAddress,
      msg,
      fee,
      memo,
      funds,
    );

    return {
      transactionHash: result.transactionHash,
      height: result.height,
      gasUsed: result.gasUsed,
      gasWanted: result.gasWanted,
    };
  }

  async signMessage(message: string): Promise<string> {
    const chain = this.getChain();

    if (!this.wallet || !this.currentWalletType) {
      throw new Error('Wallet not connected');
    }

    if (isCosmosChain(chain)) {
      const chainId = String(chain.chainId);
      const account = await this.getAccount();
      if (!account) {
        throw new Error('Wallet account not found');
      }

      if (this.currentWalletType === WalletType.KEPLR) {
        const { signature } = await (this.wallet as {
          signArbitrary: (
            chainId: string,
            signerAddress: string,
            message: string,
          ) => Promise<{ signature: string }>;
        }).signArbitrary(chainId, account.address, message);

        return signature;
      }

      if (this.currentWalletType === WalletType.COSMOSTATION) {
        const { signature } = await (this.wallet as {
          signArbitrary: (
            chainId: string,
            signerAddress: string,
            message: string,
          ) => Promise<{ signature: string }>;
        }).signArbitrary(chainId, account.address, message);

        return signature;
      }

      throw new Error('Unsupported wallet type for cosmos message signing');
    }

    if (isEvmChain(chain)) {
      if (!this.currentAddress) {
        throw new Error('Wallet address not found');
      }

      const provider = this.evmProvider || this.pickEvmProviderForCurrentWallet();
      if (!provider) {
        throw new Error('EVM provider not found');
      }

      const signature = (await provider.request({
        method: 'personal_sign',
        params: [message, this.currentAddress],
      })) as string;

      return signature;
    }

    throw new Error('Solana message signing is not implemented yet');
  }

  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      return;
    }

    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  private emit(event: string, data: unknown): void {
    if (!this.listeners.has(event)) {
      return;
    }

    this.listeners.get(event)!.forEach((callback) => callback(data));
  }

  isConnected(): boolean {
    return !!this.currentAddress;
  }

  getQueryClient(): CosmWasmClient {
    const chain = this.getChain();
    if (!isCosmosChain(chain)) {
      throw new Error('Query client only available on cosmos chains');
    }

    if (!this.cosmWasmClient) {
      throw new Error('Query client not initialized');
    }

    return this.cosmWasmClient;
  }

  getSigningClient(): SigningCosmWasmClient {
    const chain = this.getChain();
    if (!isCosmosChain(chain)) {
      throw new Error('Signing client only available on cosmos chains');
    }

    if (!this.signingCosmWasmClient) {
      throw new Error('Signing client not connected');
    }

    return this.signingCosmWasmClient;
  }

  getEvmProvider(): Eip1193Provider {
    const chain = this.getChain();
    if (!isEvmChain(chain)) {
      throw new Error('EVM provider only available on EVM chains');
    }

    if (!this.evmProvider) {
      throw new Error('EVM provider not connected');
    }

    return this.evmProvider;
  }

  private pickEvmProvider(kind: 'andao' | 'metamask'): Eip1193Provider | null {
    return (
      pickInjectedProvider(
        typeof window.ethereum === 'undefined'
          ? undefined
          : (window.ethereum as Eip1193Provider),
        kind,
      ) as Eip1193Provider | null
    );
  }

  private pickEvmProviderForCurrentWallet(): Eip1193Provider | null {
    if (this.currentWalletType === WalletType.ANDAO) {
      return this.pickEvmProvider('andao');
    }
    if (this.currentWalletType === WalletType.METAMASK) {
      return this.pickEvmProvider('metamask');
    }
    if (typeof window.ethereum !== 'undefined') {
      return window.ethereum as Eip1193Provider;
    }
    return null;
  }
}

export const walletService = new WalletServiceImpl();

// Global window interface extensions
declare global {
  interface Window {
    keplr?: unknown;
    cosmostation?: unknown;
    ethereum?: Eip1193Provider;
  }
}
