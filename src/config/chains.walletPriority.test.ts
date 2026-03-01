describe('chains wallet priority', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  function loadAvalancheWallets(env: Record<string, string | undefined>): string[] {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    let wallets: string[] = [];
    jest.isolateModules(() => {
      const mod = require('./chains');
      wallets = mod.CHAIN_REGISTRY.avalanche_fuji.wallets;
    });
    return wallets;
  }

  test('default priority is andao,metamask', () => {
    const wallets = loadAvalancheWallets({
      NEXT_PUBLIC_EVM_WALLET_PRIORITY: undefined,
      NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER: 'false',
    });
    expect(wallets).toEqual(['andao', 'metamask']);
  });

  test('respects custom wallet order', () => {
    const wallets = loadAvalancheWallets({
      NEXT_PUBLIC_EVM_WALLET_PRIORITY: 'metamask,andao',
      NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER: 'false',
    });
    expect(wallets).toEqual(['metamask', 'andao']);
  });

  test('auto appends missing supported wallets', () => {
    const wallets = loadAvalancheWallets({
      NEXT_PUBLIC_EVM_WALLET_PRIORITY: 'metamask',
      NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER: 'false',
    });
    expect(wallets).toEqual(['metamask', 'andao']);
  });

  test('require flag forces AnDao only', () => {
    const wallets = loadAvalancheWallets({
      NEXT_PUBLIC_EVM_WALLET_PRIORITY: 'metamask,andao',
      NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER: 'true',
    });
    expect(wallets).toEqual(['andao']);
  });
});
