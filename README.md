# NFT Auction Web

基于 [nft-auction](https://github.com) 智能合约与 [nft-auction-api](https://github.com) 后端的 NFT 拍卖 Web 前端。

## 技术栈

- React 18 + TypeScript
- Vite
- wagmi + viem（钱包与合约）
- TanStack Query（API 缓存）
- React Router
- Tailwind CSS

## 开发

```bash
# 安装依赖
npm install

# 复制环境变量并填写合约/API 地址
cp .env.example .env

# 启动开发服务器
npm run dev
```

## 环境变量

见 `.env.example`：

- `VITE_API_BASE_URL`：后端 API 地址（如 `http://localhost:9080`）
- `VITE_CHAIN_ID`：链 ID（如 Sepolia `11155111`）
- `VITE_AUCTION_CONTRACT_ADDRESS`：拍卖合约地址
- `VITE_NFT_CONTRACT_ADDRESS`：NFT 合约地址

## 路由

| 路径 | 说明 |
|------|------|
| / | 首页（拍卖列表） |
| /auctions/:id | 拍卖详情与出价 |
| /auctions/create | 创建拍卖 |
| /profile | 个人中心 |
| /login | 登录 |
| /register | 注册 |

## 构建

```bash
npm run build
npm run preview  # 预览生产构建
```

架构与接口说明见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。
