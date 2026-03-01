import { getInjectedProviders, pickEvmProvider, EvmProviderLike } from '@/services/evmProvider';

describe('evmProvider helpers', () => {
  test('getInjectedProviders should fallback to root provider', () => {
    const root: EvmProviderLike = { isMetaMask: true };
    expect(getInjectedProviders(root)).toEqual([root]);
  });

  test('getInjectedProviders should return providers list when present', () => {
    const andao: EvmProviderLike = { isAnDaoWallet: true };
    const metamask: EvmProviderLike = { isMetaMask: true };
    const root: EvmProviderLike = { providers: [andao, metamask] };
    expect(getInjectedProviders(root)).toEqual([andao, metamask]);
  });

  test('pickEvmProvider should pick AnDaoWallet from mixed providers', () => {
    const andao: EvmProviderLike = { isAnDaoWallet: true };
    const metamask: EvmProviderLike = { isMetaMask: true };
    const root: EvmProviderLike = { providers: [metamask, andao] };
    expect(pickEvmProvider(root, 'andao')).toBe(andao);
  });

  test('pickEvmProvider should pick MetaMask but exclude AnDaoWallet', () => {
    const andao: EvmProviderLike = { isAnDaoWallet: true, isMetaMask: true };
    const metamask: EvmProviderLike = { isMetaMask: true };
    const root: EvmProviderLike = { providers: [andao, metamask] };
    expect(pickEvmProvider(root, 'metamask')).toBe(metamask);
  });

  test('pickEvmProvider should return null when target provider missing', () => {
    const root: EvmProviderLike = { isMetaMask: true };
    expect(pickEvmProvider(root, 'andao')).toBeNull();
  });
});
