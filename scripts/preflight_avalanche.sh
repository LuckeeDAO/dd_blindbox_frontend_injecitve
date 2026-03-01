#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${1:-.env.local}"
APP_URL="${APP_URL:-http://127.0.0.1:3000}"

get_var_from_file() {
  local file="$1"
  local key="$2"
  awk -v k="${key}" '
    $0 ~ "^[[:space:]]*"k"=" {
      line=$0
      sub("^[[:space:]]*"k"=", "", line)
      print line
      exit
    }
  ' "$file" | tr -d '\r'
}

resolve_var() {
  local key="$1"
  local current="${!key:-}"
  if [ -n "${current}" ]; then
    printf '%s' "${current}"
    return
  fi
  if [ -f "$ENV_FILE" ]; then
    get_var_from_file "$ENV_FILE" "$key"
    return
  fi
  printf '%s' ""
}

if [ -f "$ENV_FILE" ]; then
  echo "[info] loaded env from $ENV_FILE"
else
  echo "[warn] env file not found: $ENV_FILE (using current shell env)"
fi

NEXT_PUBLIC_DEFAULT_CHAIN="$(resolve_var NEXT_PUBLIC_DEFAULT_CHAIN)"
NEXT_PUBLIC_EVM_WALLET_PRIORITY="$(resolve_var NEXT_PUBLIC_EVM_WALLET_PRIORITY)"
NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER="$(resolve_var NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER)"
NEXT_PUBLIC_AVALANCHE_CHAIN_ID="$(resolve_var NEXT_PUBLIC_AVALANCHE_CHAIN_ID)"
NEXT_PUBLIC_AVALANCHE_RPC_URL="$(resolve_var NEXT_PUBLIC_AVALANCHE_RPC_URL)"
NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS="$(resolve_var NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS)"
NEXT_PUBLIC_AVALANCHE_ABI="$(resolve_var NEXT_PUBLIC_AVALANCHE_ABI)"

export NEXT_PUBLIC_DEFAULT_CHAIN
export NEXT_PUBLIC_EVM_WALLET_PRIORITY
export NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER
export NEXT_PUBLIC_AVALANCHE_CHAIN_ID
export NEXT_PUBLIC_AVALANCHE_RPC_URL
export NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS
export NEXT_PUBLIC_AVALANCHE_ABI

required_non_empty=(
  NEXT_PUBLIC_DEFAULT_CHAIN
  NEXT_PUBLIC_EVM_WALLET_PRIORITY
  NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER
  NEXT_PUBLIC_AVALANCHE_CHAIN_ID
  NEXT_PUBLIC_AVALANCHE_RPC_URL
  NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS
)

echo "[1/6] Validate required Avalanche env vars"
for key in "${required_non_empty[@]}"; do
  value="${!key:-}"
  if [ -z "$value" ]; then
    echo "[error] missing required value: $key"
    exit 1
  fi
done
echo "OK"

echo "[2/6] Validate chain strategy"
if [ "${NEXT_PUBLIC_DEFAULT_CHAIN}" != "avalanche_fuji" ]; then
  echo "[error] NEXT_PUBLIC_DEFAULT_CHAIN must be avalanche_fuji for Avalanche preflight"
  exit 1
fi

if [ "${NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER}" = "true" ]; then
  if ! echo "${NEXT_PUBLIC_EVM_WALLET_PRIORITY}" | tr '[:upper:]' '[:lower:]' | grep -q "andao"; then
    echo "[error] NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER=true but wallet priority does not include andao"
    exit 1
  fi
fi
echo "OK"

echo "[3/6] Validate Avalanche contract address format"
if ! echo "${NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS}" | grep -Eiq '^0x[a-f0-9]{40}$'; then
  echo "[error] NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS is not a valid EVM address"
  exit 1
fi
if echo "${NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS}" | grep -Eiq '^0x0{40}$'; then
  echo "[error] NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS cannot be zero address"
  exit 1
fi
echo "OK"

echo "[4/6] Validate ABI JSON (optional)"
if [ -n "${NEXT_PUBLIC_AVALANCHE_ABI:-}" ]; then
  node -e '
  const abi = process.env.NEXT_PUBLIC_AVALANCHE_ABI;
  try {
    const parsed = JSON.parse(abi);
    if (!Array.isArray(parsed)) throw new Error("ABI must be an array");
  } catch (e) {
    console.error("[error] invalid NEXT_PUBLIC_AVALANCHE_ABI:", e.message);
    process.exit(1);
  }
  '
  echo "OK (custom ABI)"
else
  echo "OK (using built-in minimal ABI)"
fi

echo "[5/6] Check RPC connectivity and chainId"
node - <<'NODE'
const rpc = process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL;
const expected = Number(process.env.NEXT_PUBLIC_AVALANCHE_CHAIN_ID);
async function main() {
  const res = await fetch(rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }),
  });
  if (!res.ok) {
    throw new Error(`rpc http status ${res.status}`);
  }
  const data = await res.json();
  const hex = data?.result;
  if (typeof hex !== 'string') {
    throw new Error(`invalid rpc response: ${JSON.stringify(data)}`);
  }
  const chainId = parseInt(hex, 16);
  if (Number.isNaN(chainId)) {
    throw new Error(`invalid chainId hex: ${hex}`);
  }
  if (chainId !== expected) {
    throw new Error(`rpc chainId mismatch: got=${chainId}, expected=${expected}`);
  }
  console.log('OK');
}
main().catch((e) => {
  console.error('[error]', e.message);
  process.exit(1);
});
NODE

echo "[6/6] Optional health endpoint check"
if curl -fsS "${APP_URL}/api/health" >/tmp/blindbox_health.json 2>/dev/null; then
  node - <<'NODE'
  const fs = require('fs');
  const payload = JSON.parse(fs.readFileSync('/tmp/blindbox_health.json', 'utf8'));
  const key = payload?.chain?.key;
  const family = payload?.chain?.family;
  if (key !== 'avalanche_fuji') {
    throw new Error(`health.chain.key expected avalanche_fuji, got ${key}`);
  }
  if (family !== 'evm') {
    throw new Error(`health.chain.family expected evm, got ${family}`);
  }
  console.log('OK');
NODE
else
  echo "[warn] health endpoint unavailable at ${APP_URL}; skip"
fi

echo "Preflight passed. You can start browser wallet E2E now."
