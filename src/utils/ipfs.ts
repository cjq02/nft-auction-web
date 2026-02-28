const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

/** 将 ipfs:// 或 ipfs.io 链接转为可访问的 HTTP 图片 URL */
export function toDisplayImageUrl(uri: string | null | undefined): string | undefined {
  if (!uri || typeof uri !== 'string') return undefined
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', IPFS_GATEWAY)
  }
  if (uri.startsWith('https://') || uri.startsWith('http://')) {
    return uri
  }
  return uri
}
