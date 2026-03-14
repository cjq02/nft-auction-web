import { api } from './client'

export interface OverviewData {
  auction: {
    total: number
    active: number
    ended: number
    feeTotalEth?: string
    /** ETH 手续费折合美元，用于明细展示 */
    feeTotalEthUsd?: string
    feeByToken?: { token: string; total: string; usd: string }[]
    /** 平台手续费总额（ETH + 各代币折美元），已格式化为 "12345.67" */
    feeTotalUsd?: string
    /** 平台手续费美元总额按当前 ETH 价格换算成的 ETH 数量，用于展示「折合 x.xx ETH」 */
    feeTotalEthEquivalent?: string
  }
  nft: {
    totalSupply: number | null
    burnedCount: number | null
    currentSupply: number | null
    nextTokenId: number | null
  }
}

export function fetchOverview(): Promise<OverviewData> {
  return api
    .get<{ code: number; data: OverviewData }>('/api/overview')
    .then((res) => (res as { code: number; data: OverviewData }).data)
}
