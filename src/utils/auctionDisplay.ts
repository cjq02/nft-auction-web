import { formatEther } from 'viem'

function weiToEth(wei: string | null | undefined): string {
  if (!wei) return '-'
  try {
    return `${formatEther(BigInt(wei))} ETH`
  } catch {
    return wei
  }
}

/** 18 位小数的 USD 转展示字符串，避免 Number 精度丢失，创建时填多少就显示多少 */
function usdFormat(minBidUSD: bigint): string {
  const div = minBidUSD / (10n ** 18n)
  const rem = minBidUSD % (10n ** 18n)
  const fracStr = rem === 0n ? '' : '.' + rem.toString().padStart(18, '0').replace(/0+$/, '')
  return `$${div}${fracStr}`
}

/**
 * 合约里 minBid 为 USD（18 位小数）。
 * ETH 拍卖时用链上价格换算为 ETH 展示；代币拍卖时展示 USD。
 */
export function minBidDisplay(
  minBid: string | null | undefined,
  isEthAuction: boolean,
  ethPrice8: bigint | undefined
): string {
  if (!minBid) return '-'
  try {
    const minBidUSD = BigInt(minBid)
    if (isEthAuction) {
      if (ethPrice8 == null || ethPrice8 === 0n) return '…'
      const minBidEthWei = (minBidUSD * (10n ** 8n)) / ethPrice8
      return weiToEth(String(minBidEthWei))
    }
    return usdFormat(minBidUSD)
  } catch {
    return minBid
  }
}

/** 最低出价同时返回美元与 ETH 文案，用于详情页展示两档（前端链上/API 价格，已弃用请用 minBidDisplayFromApi） */
export function minBidDisplayDual(
  minBid: string | null | undefined,
  ethPrice8: bigint | undefined
): { usd: string; eth: string } {
  if (!minBid) return { usd: '-', eth: '-' }
  try {
    const minBidUSD = BigInt(minBid)
    const usd = usdFormat(minBidUSD)
    if (ethPrice8 == null || ethPrice8 === 0n) return { usd, eth: '—' }
    const minBidEthWei = (minBidUSD * (10n ** 8n)) / ethPrice8
    return { usd, eth: weiToEth(String(minBidEthWei)) }
  } catch {
    return { usd: minBid, eth: '-' }
  }
}

/**
 * ETH wei 转 USD 展示（使用 Chainlink 8 位小数价格）
 * usdRaw = ethWei * ethPrice8 / 10^26
 */
export function ethWeiToUsdDisplay(ethWei: bigint, ethPrice8: bigint | undefined): string {
  if (!ethPrice8 || ethPrice8 === 0n) return ''
  const usdRaw = (ethWei * ethPrice8) / 10n ** 26n
  if (usdRaw === 0n) return ''
  const formatted = usdRaw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `~$${formatted}`
}

/**
 * ERC20 余额（18 位小数）转 USD 展示（使用 Chainlink 8 位小数价格）
 */
export function tokenBalanceToUsdDisplay(
  balance: bigint,
  tokenPrice8: bigint | undefined
): string {
  if (!tokenPrice8 || tokenPrice8 === 0n) return ''
  const usdRaw = (balance * tokenPrice8) / 10n ** 26n
  if (usdRaw === 0n) return ''
  const formatted = usdRaw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `~$${formatted}`
}

/**
 * 格式化 ETH 金额并附带 USD（如有价格）
 * 例: "0.5 ETH" 或 "0.5 ETH (~$1,500)"
 */
export function formatEthWithUsd(
  ethWei: bigint,
  ethPrice8: bigint | undefined
): { eth: string; usd: string } {
  const eth = `${formatEther(ethWei)} ETH`
  const usd = ethWeiToUsdDisplay(ethWei, ethPrice8)
  return { eth, usd }
}

/** 最低出价展示：使用后端返回的 minBid（USD）与 minBidEth（已换算），无需前端读链 */
export function minBidDisplayFromApi(
  minBid: string | null | undefined,
  minBidEth: string | null | undefined
): { usd: string; eth: string } {
  if (!minBid) return { usd: '-', eth: '-' }
  try {
    const usd = usdFormat(BigInt(minBid))
    const eth = minBidEth != null && minBidEth !== '' ? `${minBidEth} ETH` : '—'
    return { usd, eth }
  } catch {
    return { usd: minBid, eth: '—' }
  }
}
