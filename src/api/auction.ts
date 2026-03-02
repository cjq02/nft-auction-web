import { api } from './client'

/** 前端使用小写，传给后端前要转为首字母大写 */
export type AuctionStatus = 'active' | 'ended' | 'cancelled'

/** 后端实际存储的状态值（首字母大写） */
function toApiStatus(status: AuctionStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export interface AuctionListItem {
  id: number
  seller: string
  nftContract: string
  tokenId: string
  startTime: string
  endTime: string
  minBid: string
  paymentToken: string | null
  status: AuctionStatus
  nft?: { name?: string; image?: string; description?: string }
  highestBid?: { amount: string; bidder: string }
}

export interface AuctionDetail extends AuctionListItem {
  bids?: BidItem[]
}

export interface BidItem {
  id?: number
  bidder: string
  amount: string
  timestamp: string
  isETH: boolean
}

export interface ListParams {
  page?: number
  limit?: number
  status?: AuctionStatus
}

export interface ListResponse<T> {
  items: T[]
  total?: number
  page?: number
  limit?: number
}

export function fetchAuctionList(params?: ListParams) {
  const search = new URLSearchParams()
  if (params?.page != null) search.set('page', String(params.page))
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.status) search.set('status', toApiStatus(params.status))
  const q = search.toString()
  return api
    .get<{ code: number; data: ListResponse<AuctionListItem> }>(`/api/auctions${q ? `?${q}` : ''}`)
    .then((res) => res.data)
}

export function fetchAuctionById(id: string) {
  return api.get<AuctionDetail>(`/api/auctions/${id}`)
}

export function fetchAuctionBids(id: string) {
  return api.get<{ data: BidItem[] }>(`/api/auctions/${id}/bids`).then((r) => r.data || [])
}

export function fetchUserAuctions(address: string) {
  return api
    .get<{ code: number; data: ListResponse<AuctionListItem> }>(`/api/users/${address}/auctions`)
    .then((res) => res.data)
}

/** 交易上链确认后，将 txHash 上报给后端，由后端从链上读取事件并写库 */
export function postSyncAuction(txHash: string) {
  return api.post<{ code: number; data: AuctionListItem }>('/api/auctions', { txHash })
}
