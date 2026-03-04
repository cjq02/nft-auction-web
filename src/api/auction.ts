import { api } from './client'

/** 前端使用小写，传给后端前要转为首字母大写 */
export type AuctionStatus = 'active' | 'ended' | 'cancelled'

/** 后端实际存储的状态值（首字母大写） */
function toApiStatus(status: AuctionStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export interface AuctionListItem {
  id?: number
  auctionId: number
  seller: string
  nftContract: string
  tokenId: number
  startTime: number
  endTime: number
  minBid: string
  paymentToken: string | null
  status: string          // 后端返回 "Active" / "Ended" / "Cancelled"
  nft?: { name?: string; image?: string; description?: string; tokenURI?: string }
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
  return api
    .get<{ code: number; data: AuctionDetail }>(`/api/auctions/${id}`)
    .then((res) => res.data)
}

export function fetchAuctionBids(id: string) {
  return api
    .get<{ code: number; data: { bids: BidItem[] } }>(`/api/auctions/${id}/bids`)
    .then((res) => res.data?.bids ?? [])
}

export function fetchUserAuctions(address: string) {
  return api
    .get<{ code: number; data: ListResponse<AuctionListItem> }>(`/api/users/${address}/auctions`)
    .then((res) => res.data)
}

