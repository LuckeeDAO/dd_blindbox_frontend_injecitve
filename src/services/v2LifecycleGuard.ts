import type { BlindBoxStatusV2, PurchaseInfoV2 } from '@/services/contractV2';

const POST_PUBLISH_STATUSES: BlindBoxStatusV2[] = ['Rewarded', 'AfterSale', 'Completed'];

export function canExposeMintedTokens(status: BlindBoxStatusV2): boolean {
  return POST_PUBLISH_STATUSES.includes(status);
}

export function sanitizePurchaseTokensBeforePublish(
  purchase: PurchaseInfoV2,
  status: BlindBoxStatusV2,
): PurchaseInfoV2 {
  if (canExposeMintedTokens(status)) {
    return purchase;
  }

  return {
    ...purchase,
    nft_tokens: [],
  };
}

export function assertNoMintedTokenBeforePublish(
  purchase: PurchaseInfoV2,
  status: BlindBoxStatusV2,
): void {
  if (!canExposeMintedTokens(status) && purchase.nft_tokens.length > 0) {
    throw new Error('Token IDs must not be exposed before rarity publish');
  }
}
