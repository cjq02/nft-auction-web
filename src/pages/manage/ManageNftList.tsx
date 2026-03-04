import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchNftList, type MintedNftItem } from '../../api/nft'
import { toDisplayImageUrl } from '../../utils/ipfs'
import { NFT_CONTRACT_ADDRESS } from '../../contracts/addresses'

function formatAddress(addr: string) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white"
      title={`复制${label}`}
    >
      {copied ? '已复制' : '复制'}
    </button>
  )
}

function NftCard({ item }: { item: MintedNftItem }) {
  const imageUrl = toDisplayImageUrl(item.image ?? item.tokenUri ?? undefined)

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="aspect-square bg-zinc-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name ?? `#${item.tokenId}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-zinc-600">
            #{item.tokenId}
          </div>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-white truncate">
            {item.name ?? `Token #${item.tokenId}`}
          </h3>
          <span className="shrink-0 text-xs text-zinc-500">ID: {item.tokenId}</span>
        </div>

        <div>
          <p className="text-xs text-zinc-500">接收账户（当前持有人）</p>
          <div className="mt-0.5 flex items-center gap-1">
            {item.ownerName ? (
              <span className="text-sm text-white font-medium truncate" title={item.owner}>
                {item.ownerName}
              </span>
            ) : (
              <span className="font-mono text-sm text-zinc-300 truncate" title={item.owner}>
                {formatAddress(item.owner)}
              </span>
            )}
            <CopyButton text={item.owner} label="地址" />
          </div>
        </div>

        {item.tokenUri && (
          <div>
            <p className="text-xs text-zinc-500">元数据 URI</p>
            <div className="mt-0.5 flex items-center gap-1 min-w-0">
              <span className="font-mono text-xs text-zinc-400 truncate" title={item.tokenUri}>
                {item.tokenUri}
              </span>
              <CopyButton text={item.tokenUri} label="URI" />
            </div>
          </div>
        )}

        {item.description && (
          <p className="text-xs text-zinc-400 line-clamp-2">{item.description}</p>
        )}
      </div>
    </div>
  )
}

export function ManageNftList() {
  const contract =
    NFT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'
      ? NFT_CONTRACT_ADDRESS
      : undefined
  const { data: list, isLoading, error } = useQuery({
    queryKey: ['nftList', contract],
    queryFn: () => fetchNftList(contract),
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-zinc-400">
        加载中…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
        加载失败: {(error as Error).message}
        <p className="mt-2 text-sm text-zinc-400">
          请确认后端已实现 GET /api/nfts/list 并已启动。
        </p>
      </div>
    )
  }

  const items = Array.isArray(list) ? list : []

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-zinc-400">
        暂无已铸造 NFT
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-medium text-white">已铸造 NFT</h2>
      <p className="text-sm text-zinc-400">共 {items.length} 个</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <NftCard key={item.tokenId} item={item} />
        ))}
      </div>
    </section>
  )
}
