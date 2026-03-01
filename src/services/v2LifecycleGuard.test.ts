import {
  assertNoMintedTokenBeforePublish,
  canExposeMintedTokens,
  sanitizePurchaseTokensBeforePublish,
} from '@/services/v2LifecycleGuard';
import { PurchaseInfoV2 } from '@/services/contractV2';

const basePurchase: PurchaseInfoV2 = {
  id: 1,
  user: '0xabc',
  blind_box_id: 1,
  period: 1,
  quantity: 1,
  total_price: { denom: 'usdt', amount: '2000000' },
  random_hash: 'hash',
  random_value: null,
  revealed_at: null,
  prize_level: null,
  nft_tokens: ['token-1'],
  purchased_at: '2026-02-28T00:00:00.000Z',
};

describe('v2LifecycleGuard', () => {
  test('公布前（Revealed）不应暴露 tokenId', () => {
    expect(canExposeMintedTokens('Revealed')).toBe(false);
    const sanitized = sanitizePurchaseTokensBeforePublish(basePurchase, 'Revealed');
    expect(sanitized.nft_tokens).toEqual([]);
  });

  test('公布后（Rewarded/AfterSale/Completed）可暴露 tokenId', () => {
    expect(canExposeMintedTokens('Rewarded')).toBe(true);
    expect(canExposeMintedTokens('AfterSale')).toBe(true);
    expect(canExposeMintedTokens('Completed')).toBe(true);
  });

  test('公布前若出现 tokenId 应抛错', () => {
    expect(() =>
      assertNoMintedTokenBeforePublish(basePurchase, 'Packaged'),
    ).toThrow('Token IDs must not be exposed before rarity publish');
  });

  test('公布后允许 tokenId 存在', () => {
    expect(() =>
      assertNoMintedTokenBeforePublish(basePurchase, 'Rewarded'),
    ).not.toThrow();
  });
});

