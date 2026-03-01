#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/5] Check required multi-chain env keys in env.example"
REQUIRED_KEYS=(
  NEXT_PUBLIC_DEFAULT_CHAIN
  NEXT_PUBLIC_EVM_WALLET_PRIORITY
  NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER
  NEXT_PUBLIC_AVALANCHE_CHAIN_ID
  NEXT_PUBLIC_AVALANCHE_RPC_URL
  NEXT_PUBLIC_INJECTIVE_CHAIN_ID
  NEXT_PUBLIC_INJECTIVE_RPC_URL
  NEXT_PUBLIC_SOLANA_CHAIN_ID
)

for key in "${REQUIRED_KEYS[@]}"; do
  if ! grep -q "^${key}=" env.example; then
    echo "Missing key: ${key}"
    exit 1
  fi
done
echo "OK"

echo "[2/5] Validate chain registry exists"
[ -f "src/config/chains.ts" ]
[ -f "src/stores/chain.ts" ]
[ -f "src/services/wallet.ts" ]
[ -f "src/services/contractV2.ts" ]
rg -q "ANDAO" src/types/wallet.ts
echo "OK"

echo "[3/5] Type check"
npm run type-check >/dev/null

echo "[4/5] Search for remaining hardcoded injective defaults in runtime critical files"
if rg -n "injective-888|testnet\.sentry\.tm\.injective\.network:443" src/services src/config src/hooks src/app/api -S >/tmp/blindbox_smoke_rg.out 2>/dev/null; then
  echo "Found chain-specific defaults (expected only in fallback config)."
  cat /tmp/blindbox_smoke_rg.out
else
  echo "No unexpected injective hardcoded values in critical runtime files."
fi

echo "[5/5] Done"
echo "Manual checks still required:"
echo "- Avalanche: AnDaoWallet/MetaMask connect + buy/reveal tx on deployed contract"
echo "- Injective: Keplr connect + query current_sale"
