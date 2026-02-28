import { api } from './client'

export interface MintedNftItem {
  tokenId: number
  owner: string
  tokenUri?: string | null
  name?: string | null
  description?: string | null
  image?: string | null
}

/** 后端返回的列表结构（分页） */
interface NftListResponse {
  items: MintedNftItem[]
  limit?: number
  page?: number
  total?: number
}

export function fetchNftList(contract?: string): Promise<MintedNftItem[]> {
  const q = contract ? `?contract=${encodeURIComponent(contract)}` : ''
  return api
    .get<{ code: number; data?: NftListResponse }>(`/api/nfts/list${q}`)
    .then((res) => (Array.isArray(res.data?.items) ? res.data!.items : []))
}
