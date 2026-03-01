#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

SOURCE_ENV="${1:-.env.local}"
TARGET_ENV="${2:-.env.avalanche.local}"

echo "[1/3] Prepare target env file: ${TARGET_ENV}"
cp env.example "${TARGET_ENV}"

if [ -f "${SOURCE_ENV}" ]; then
  echo "[2/3] Merge shared keys from ${SOURCE_ENV}"
  while IFS='=' read -r key value; do
    [ -z "${key}" ] && continue
    [[ "${key}" =~ ^# ]] && continue
    case "${key}" in
      NEXT_PUBLIC_APP_NAME|NEXT_PUBLIC_APP_DESCRIPTION|NEXT_PUBLIC_ADMIN_ADDRESSES|NEXT_PUBLIC_AVALANCHE_ADMIN_ADDRESSES|NEXT_PUBLIC_INJECTIVE_ADMIN_ADDRESSES)
        sed -i "s|^${key}=.*|${key}=${value}|" "${TARGET_ENV}" || true
        ;;
    esac
  done < "${SOURCE_ENV}"
else
  echo "[2/3] Source env not found, skip merge: ${SOURCE_ENV}"
fi

echo "[3/3] Apply Avalanche-first defaults"
sed -i "s|^NEXT_PUBLIC_DEFAULT_CHAIN=.*|NEXT_PUBLIC_DEFAULT_CHAIN=avalanche_fuji|" "${TARGET_ENV}"
sed -i "s|^NEXT_PUBLIC_EVM_WALLET_PRIORITY=.*|NEXT_PUBLIC_EVM_WALLET_PRIORITY=andao,metamask|" "${TARGET_ENV}"
sed -i "s|^NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER=.*|NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER=false|" "${TARGET_ENV}"

echo
echo "Generated ${TARGET_ENV}"
echo "Next step:"
echo "1) Fill NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS with real deployed contract"
echo "2) Optional: set NEXT_PUBLIC_AVALANCHE_ABI and method overrides"
echo "3) Run: bash scripts/preflight_avalanche.sh ${TARGET_ENV}"
