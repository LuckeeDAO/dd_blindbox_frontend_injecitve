export interface EvmProviderLike {
  isAnDaoWallet?: boolean;
  isMetaMask?: boolean;
  providers?: EvmProviderLike[];
}

export type EvmProviderKind = 'andao' | 'metamask';

export function getInjectedProviders(root?: EvmProviderLike): EvmProviderLike[] {
  if (!root) return [];
  if (Array.isArray(root.providers) && root.providers.length > 0) {
    return root.providers;
  }
  return [root];
}

export function pickEvmProvider(
  root: EvmProviderLike | undefined,
  kind: EvmProviderKind,
): EvmProviderLike | null {
  const providers = getInjectedProviders(root);

  if (kind === 'andao') {
    const andao = providers.find((provider) => provider.isAnDaoWallet);
    return andao || null;
  }

  const metamask = providers.find(
    (provider) => provider.isMetaMask && !provider.isAnDaoWallet,
  );
  return metamask || null;
}
