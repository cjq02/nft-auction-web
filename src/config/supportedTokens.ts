/**
 * 支持的 ERC20 出价代币配置
 * 合约需已通过 setTokenPriceFeed 设置价格预言机
 *
 * 配置方式（二选一，推荐方式 1）：
 * 1. 编辑同目录下 supported-tokens.default.json（多行 JSON，易读易改）
 * 2. 设置环境变量 VITE_SUPPORTED_TOKENS 覆盖（JSON 数组字符串）
 *
 * 字段说明：
 * faucetMinEth: 可选，有此字段时代币支持用 ETH 充值（调用 mint() payable）
 * adminMint: 可选，为 true 时表示仅管理员（合约 owner）可铸造，管理页「代币铸造」中可选该代币
 */
import defaultTokensJson from './supported-tokens.default.json'

export interface SupportedToken {
  address: `0x${string}`
  symbol: string
  decimals: number
  /** 用 ETH 充值时的最小金额，如 "0.001" */
  faucetMinEth?: string
  /** 是否为管理员铸造代币（仅 owner 可 mint，在管理页「代币铸造」中可选） */
  adminMint?: boolean
}

type RawToken = {
  address: string
  symbol: string
  decimals?: number
  faucetMinEth?: string
  adminMint?: boolean
}

function normalizeTokens(arr: RawToken[]): SupportedToken[] {
  return arr.map((t) => ({
    address: t.address as `0x${string}`,
    symbol: t.symbol,
    decimals: t.decimals ?? 18,
    faucetMinEth: t.faucetMinEth,
    adminMint: t.adminMint === true,
  }))
}

const ZERO = '0x0000000000000000000000000000000000000000' as `0x${string}`

/** 合约要求 ERC20 必须为 18 位小数 */
export const REQUIRED_DECIMALS = 18

function loadSupportedTokens(): SupportedToken[] {
  const raw = import.meta.env.VITE_SUPPORTED_TOKENS
  if (raw && typeof raw === 'string' && raw.trim()) {
    try {
      return normalizeTokens(JSON.parse(raw) as RawToken[])
    } catch {
      // 解析失败时回退到默认文件
    }
  }
  return normalizeTokens(defaultTokensJson as RawToken[])
}

const _allTokens = loadSupportedTokens()
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

/** 标记为管理员铸造的代币（adminMint === true），用于管理页「代币铸造」 */
export const ADMIN_MINT_TOKENS = SUPPORTED_TOKENS.filter((t) => t.adminMint === true)
