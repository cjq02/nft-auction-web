# 已铸造 NFT 列表（铸造给谁 + 元数据 + NFT）

> 需求：在管理端能看到「铸造给了哪个账户」「元数据」「NFT 本身」（名称、图片等）。

---

## 一、要展示的内容

| 维度 | 说明 | 数据来源 |
|------|------|----------|
| **接收账户** | 该 NFT 当前持有人（铸造时 to，或后续转移后的 owner） | 链上 `ownerOf(tokenId)` |
| **Token ID** | 链上 token 编号 | 枚举 1 ~ totalSupply |
| **元数据** | tokenURI、name、description、image 等 | 链上 `tokenURI(tokenId)` + 拉取 JSON，或 API 缓存 |
| **NFT** | 名称、描述、图片（用于列表卡片展示） | 同上元数据中的 name / description / image |

---

## 二、API 设计建议

### 方案 A：新增列表接口（推荐）

- **接口**：`GET /api/nfts/list?contract=0x...`（contract 可选，默认用配置的 NFT 合约）
- **逻辑**：
  1. 调用链上 `totalSupply(contract)` 得到数量 N；
  2. 对 `tokenId = 1 .. N`：
     - 调链上 `ownerOf(contract, tokenId)` 得到持有人地址；
     - 调现有「元数据获取」逻辑（或 `GetOrFetchMetadata`）得到 name、description、image、tokenURI；
  3. 返回数组，每项包含：`tokenId`、`owner`、`tokenURI`、`name`、`description`、`image`。
- **响应示例**：
```json
{
  "code": 0,
  "data": [
    {
      "tokenId": 1,
      "owner": "0x085f0145202298585e699371eb3CFb1441f65110",
      "tokenUri": "ipfs://QmXXX",
      "name": "My NFT #1",
      "description": "First mint",
      "image": "ipfs://QmYYY"
    }
  ]
}
```

### 方案 B：仅用现有接口由前端拼装

- 用 `GET /api/overview` 拿 `nft.totalSupply`；
- 对每个 tokenId 调 `GET /api/nfts/:contract/:tokenId` 拿元数据；
- 持有人需前端自己连链调 `ownerOf(tokenId)`（或 API 提供单独的 owner 查询）。
- 缺点：请求多、前端逻辑重，列表大时性能差。

**建议**：采用方案 A，由后端统一拉链上 + 元数据后一次返回列表。

---

## 三、后端需补的能力

1. **链上**  
   - 在 NFT 合约封装中增加 `ownerOf(contractAddress, tokenId)` 的只读调用（若尚未提供）。

2. **接口**  
   - 实现 `GET /api/nfts/list`（或 `/api/manage/nfts`），内部：
     - 用配置的 NFT 合约地址（或 query 的 contract）；
     - 循环 1..totalSupply，取 owner + 元数据；
     - 返回上述结构的数组。

3. **性能**  
   - totalSupply 很大时可考虑：分页（如 `?page=1&limit=20`）、缓存列表结果、或只返回「最近 N 条」铸造记录（若后续有事件索引）。

---

## 四、前端展示建议

- **入口**：管理后台下增加一个 Tab，如「已铸造 / NFT 列表」。
- **列表**：卡片或表格，每行/每卡包含：
  - **接收账户**：`owner` 地址（可短显 + 复制）。
  - **Token ID**：`tokenId`。
  - **元数据**：展示 `tokenURI`，以及 `name`、`description`、`image`（若接口返回）。
  - **NFT**：用 `image` 做缩略图，`name` 做标题，可点击进详情或复制 tokenURI。
- **无数据**：totalSupply 为 0 时提示「暂无已铸造 NFT」。

---

## 五、与现有流程的关系

- **铸造**：管理端「铸造 NFT」仍用现有表单（to + tokenURI）；铸造成功后，新 token 会出现在「已铸造 NFT」列表中（下次请求列表或刷新后）。
- **元数据**：列表中的 name/description/image 与当前「单 NFT 元数据」逻辑一致（如走 IPFS 网关、API 缓存等），无需两套规范。

---

## 六、实现顺序建议

1. 写本文档（MD）— 已完成。
2. 后端：链上 `ownerOf` 封装 → `GET /api/nfts/list` 实现。
3. 前端：调用列表接口 → 管理页新增「已铸造 / NFT 列表」Tab → 展示 接收账户 / 元数据 / NFT。
