/**
 * 支持的 ERC20 出价代币配置
 * 合约需已通过 setTokenPriceFeed 设置价格预言机
 * 可通过 VITE_SUPPORTED_TOKENS 环境变量覆盖（JSON 数组）
 * faucetMinEth: 可选，有此字段时代币支持用 ETH 充值（调用 mint() payable）
 */
export interface SupportedToken {
  address: `0x${string}`
  symbol: string
  decimals: number
  /** 用 ETH 充值时的最小金额，如 "0.001" */
  faucetMinEth?: string
}

const ZERO = '0x0000000000000000000000000000000000000000' as `0x${string}`

/** 合约要求 ERC20 必须为 18 位小数 */
export const REQUIRED_DECIMALS = 18

/** 默认支持的代币（Sepolia 等测试网示例，需根据实际部署调整，合约要求 decimals=18） */
const DEFAULT_TOKENS: SupportedToken[] = [
  // 示例：{ address: '0x...' as `0x${string}`, symbol: 'USDC', decimals: 18 },
]

function parseEnvTokens(): SupportedToken[] {
  try {
    const raw = import.meta.env.VITE_SUPPORTED_TOKENS
    if (!raw || typeof raw !== 'string') return DEFAULT_TOKENS
    const arr = JSON.parse(raw) as Array<{
      address: string
      symbol: string
      decimals?: number
      faucetMinEth?: string
    }>
    return arr.map((t) => ({
      address: t.address as `0x${string}`,
      symbol: t.symbol,
      decimals: t.decimals ?? 18,
      faucetMinEth: t.faucetMinEth,
    }))
  } catch {
    return DEFAULT_TOKENS
  }
}

const _allTokens = parseEnvTokens()
/** 仅返回 decimals=18 的代币（合约要求） */
export const SUPPORTED_TOKENS = _allTokens.filter((t) => t.decimals === REQUIRED_DECIMALS)

export const PAYMENT_ETH = ZERO

/** 判断是否为 ETH 支付 */
export function isEthPayment(addr: string | null | undefined): boolean {
  if (!addr) return true
  return addr.toLowerCase() === ZERO.toLowerCase()
}

/** 根据地址获取代币配置 */
export function getTokenByAddress(addr: string | null | undefined): SupportedToken | null {
  if (!addr || isEthPayment(addr)) return null
  return SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === addr.toLowerCase()) ?? null
}
