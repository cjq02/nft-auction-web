import { api } from './client'

export interface OverviewData {
  auction: {
    total: number
    active: number
    ended: number
  }
  nft: {
    totalSupply: number | null
    nextTokenId: number | null
  }
}

export function fetchOverview(): Promise<OverviewData> {
  return api
    .get<{ code: number; data: OverviewData }>('/api/overview')
    .then((res) => res.data)
}
