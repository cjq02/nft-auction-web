import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAuctionList } from '../hooks/useAuction'
import { useQueryClient } from '@tanstack/react-query'
import { toDisplayImageUrl } from '../utils/ipfs'

function formatTime(ts: number | string | null | undefined) {
  if (!ts) return '-'
  const ms = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
  return isNaN(ms) ? '-' : new Date(ms).toLocaleString('zh-CN')
}

function formatAddress(addr: string) {
  if (!addr) return '-'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function weiToEth(wei: string) {
  try {
    return `${formatEther(BigInt(wei))} ETH`
  } catch {
    return wei
  }
}

export function Home() {
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching, error } = useAuctionList({ status: 'active', limit: 20 })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['auctions'] })
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-xl bg-[var(--card)]"
            />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-red-400">
        加载失败: {(error as Error).message}
      </div>
    )
  }

  const list = Array.isArray(data?.items) ? data.items : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">进行中的拍卖</h1>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-zinc-400 hover:border-[var(--accent)]/50 hover:text-white disabled:opacity-50"
        >
          <svg
            className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isFetching ? '刷新中…' : '刷新'}
        </button>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-zinc-400">
          暂无拍卖，去
          <Link to="/auctions/create" className="ml-1 text-[var(--accent)] hover:underline">
            创建拍卖
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((auction) => {
            const auctionId = auction.auctionId ?? auction.id
            return (
            <Link
              key={auctionId}
              to={`/auctions/${auctionId}`}
              className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--accent)]/50"
            >
              <div className="aspect-square bg-zinc-800">
                {auction.nft?.image ? (
                  <img
                    src={toDisplayImageUrl(auction.nft.image) ?? auction.nft.image}
                    alt={auction.nft.name ?? 'NFT'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl text-zinc-600">
                    #
                    {auction.tokenId}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-medium text-white group-hover:text-[var(--accent)]">
                  {auction.nft?.name ?? `Token #${auction.tokenId}`}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  卖家 {formatAddress(auction.seller)}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  结束 {formatTime(auction.endTime)}
                </p>
                {auction.highestBid && (
                  <p className="mt-2 text-sm text-[var(--accent)]">
                    当前最高: {weiToEth(auction.highestBid.amount)}
                  </p>
                )}
              </div>
            </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
