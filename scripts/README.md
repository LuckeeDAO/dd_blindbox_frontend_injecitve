# dd_blindbox_frontend/scripts

本目录存放前端侧脚本，主要由根目录 `./scripts` 包装调用。

## 1. 脚本清单

- `bootstrap_avalanche_env.sh`
  - 基于 `env.example` 生成 Avalanche 优先的环境文件
- `preflight_avalanche.sh`
  - Avalanche 预检：环境变量、RPC 连通性、链 ID、健康检查
- `smoke_multichain.sh`
  - 多链静态冒烟：关键配置文件、类型检查、硬编码扫描
- `upload_to_github.sh`
  - 历史脚本，非统一入口

## 2. 推荐调用方式

从项目根目录执行（推荐）：

```bash
cd /home/lc/luckee_dao/dd_blindbox_injective
./scripts/deploy.sh preflight .env.local
./scripts/deploy.sh smoke
```

直接在前端目录执行（调试时）：

```bash
cd /home/lc/luckee_dao/dd_blindbox_injective/dd_blindbox_frontend
bash ./scripts/preflight_avalanche.sh .env.local
bash ./scripts/smoke_multichain.sh
```

## 3. preflight 必填环境变量

- `NEXT_PUBLIC_DEFAULT_CHAIN`（必须为 `avalanche_fuji`）
- `NEXT_PUBLIC_EVM_WALLET_PRIORITY`
- `NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER`
- `NEXT_PUBLIC_AVALANCHE_CHAIN_ID`
- `NEXT_PUBLIC_AVALANCHE_RPC_URL`
- `NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS`

可选：

- `NEXT_PUBLIC_AVALANCHE_ABI`
- `APP_URL`（默认 `http://127.0.0.1:3000`）

## 4. 输出约定

- 失败时返回非 0 退出码，便于 CI/上层脚本中断。
- `preflight` 会进行链连通性校验，若 RPC/chainId 不匹配会直接失败。
