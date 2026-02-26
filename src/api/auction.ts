import { api } from './client'

export type AuctionStatus = 'active' | 'ended' | 'cancelled'

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
  data: T[]
  total?: number
  page?: number
  limit?: number
}

export function fetchAuctionList(params?: ListParams) {
  const search = new URLSearchParams()
  if (params?.page != null) search.set('page', String(params.page))
  if (params?.limit != null) search.set('limit', String(params.limit))
  if (params?.status) search.set('status', params.status)
  const q = search.toString()
  return api.get<ListResponse<AuctionListItem>>(`/api/auctions${q ? `?${q}` : ''}`)
}

export function fetchAuctionById(id: string) {
  return api.get<AuctionDetail>(`/api/auctions/${id}`)
}

export function fetchAuctionBids(id: string) {
  return api.get<{ data: BidItem[] }>(`/api/auctions/${id}/bids`).then((r) => r.data || [])
}

export function fetchUserAuctions(address: string) {
  return api.get<ListResponse<AuctionListItem>>(`/api/users/${address}/auctions`)
}
