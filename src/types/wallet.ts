import { EncodeObject } from '@cosmjs/proto-signing';
import { StdFee } from '@cosmjs/stargate';

export enum WalletType {
  KEPLR = 'keplr',
  COSMOSTATION = 'cosmostation',
  LEAP = 'leap',
  METAMASK = 'metamask',
  ANDAO = 'andao',
}

export interface WalletInfo {
  type: WalletType;
  chainKey?: string;
  address: string;
  pubKey: Uint8Array;
  algo: string;
  isNanoLedger: boolean;
  balance?: string;
  connected: boolean;
}

export interface AccountInfo {
  address: string;
  pubKey: Uint8Array;
  algo: string;
  isNanoLedger: boolean;
}

export interface Balance {
  denom: string;
  amount: string;
}

export interface WalletError {
  code: string;
  message: string;
  details?: unknown;
}

export interface Transaction {
  msgs: readonly EncodeObject[];
  fee: StdFee | 'auto';
  memo?: string;
}

export interface TransactionResult {
  transactionHash: string;
  height: number;
  gasUsed: bigint;
  gasWanted: bigint;
}
