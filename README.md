# DD Blind Box 前端应用

基于 Next.js 的去中心化盲盒交易平台前端应用。

## 功能特性

- **现代化 UI**：使用 Tailwind CSS 和 Framer Motion
- **钱包集成**：支持助记词连接钱包
- **盲盒展示**：美观的盲盒卡片展示
- **购买流程**：流畅的购买体验
- **开盒动画**：炫酷的开盒动画效果
- **状态管理**：使用 Zustand 进行全局状态管理
- **实时更新**：自动刷新数据和状态
- **响应式设计**：支持移动端和桌面端

## 技术栈

- **Next.js 15** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Framer Motion** - 动画库
- **Zustand** - 状态管理
- **CosmJS** - 区块链交互
- **React Hot Toast** - 通知组件

## 开发环境

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 类型检查

```bash
npm run type-check
```

### 构建生产版本

```bash
npm run build
```

## 环境配置

创建环境变量文件：

```bash
cp env.example .env.local
```

配置以下变量：

```env
NEXT_PUBLIC_CHAIN_ID=injective-1
NEXT_PUBLIC_RPC_URL=https://injective-rpc.publicnode.com
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_APP_NAME=Luckee Blind Box
NEXT_PUBLIC_APP_DESCRIPTION=基于 Injective 的去中心化盲盒交易平台
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理员页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── admin/             # 管理员组件
│   ├── BlindBoxCard.tsx   # 盲盒卡片
│   ├── BuyForm.tsx        # 购买表单
│   ├── OpenBoxAnimation.tsx # 开盒动画
│   └── WalletConnect.tsx  # 钱包连接
├── hooks/                 # 自定义 Hooks
├── services/              # 服务层
│   ├── contract.ts        # 合约服务
│   └── wallet.ts          # 钱包服务
├── stores/                # 状态管理
│   ├── blindbox.ts        # 盲盒状态
│   └── wallet.ts           # 钱包状态
├── types/                  # TypeScript 类型
│   └── index.ts           # 类型定义
└── utils/                  # 工具函数
```

## 主要组件

### BlindBoxCard
盲盒卡片组件，展示盲盒信息和购买按钮。

### BuyForm
购买表单组件，处理盲盒购买逻辑。

### OpenBoxAnimation
开盒动画组件，提供炫酷的开盒体验。

### WalletConnect
钱包连接组件，支持助记词连接。

## 状态管理

### WalletStore
管理钱包连接状态、余额信息等。

### BlindBoxStore
管理盲盒数据、购买记录等。

## 服务层

### WalletService
处理钱包连接、余额查询、交易发送等。

### ContractService
处理智能合约交互，包括查询和执行。

## 部署说明

### 构建应用

```bash
npm run build
```

### 部署到 Vercel

```bash
npm run deploy
```

## 开发指南

### 添加新组件

1. 在 `src/components/` 目录下创建组件文件
2. 使用 TypeScript 确保类型安全
3. 遵循 React 最佳实践
4. 使用 Tailwind CSS 进行样式

### 添加新页面

1. 在 `src/app/` 目录下创建页面文件
2. 使用 App Router 规范
3. 添加必要的元数据

### 状态管理

1. 使用 Zustand 进行全局状态管理
2. 组件内部使用 React hooks
3. 保持状态的单一数据源

## 测试

### 运行测试

```bash
npm run test
```

### 测试覆盖率

```bash
npm run test:coverage
```

## 许可证

MIT License

