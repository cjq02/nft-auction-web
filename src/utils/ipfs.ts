import { BASE_URL } from '../api/client'

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

/**
 * 优先走后端图片代理（有缓存，加载更快）；否则将 ipfs:// 转为网关直连
 */
export function toDisplayImageUrl(uri: string | null | undefined): string | undefined {
  if (!uri || typeof uri !== 'string') return undefined
  if (uri.startsWith('ipfs://') || uri.startsWith('https://') || uri.startsWith('http://')) {
    return `${BASE_URL}/api/nfts/image?u=${encodeURIComponent(uri)}`
  }
  return uri
}

/** 直连网关 URL（不经过代理），用于不需要缓存的场景 */
export function toDirectImageUrl(uri: string | null | undefined): string | undefined {
  if (!uri || typeof uri !== 'string') return undefined
  if (uri.startsWith('ipfs://')) return uri.replace('ipfs://', IPFS_GATEWAY)
  if (uri.startsWith('https://') || uri.startsWith('http://')) return uri
  return uri
}
