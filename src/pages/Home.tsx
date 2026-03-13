import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAuctionList } from '../hooks/useAuction'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toDisplayImageUrl } from '../utils/ipfs'
import { minBidDisplayFromApi } from '../utils/auctionDisplay'
import { fetchAuctionStats } from '../api/auction'

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
  const [search, setSearch] = useState('')
  const { data: statsFromApi } = useQuery({
    queryKey: ['auctionStats'],
    queryFn: () => fetchAuctionStats(),
  })

  const list = Array.isArray(data?.items) ? data.items : []

  const filteredList = useMemo(() => {
    if (!search.trim()) return list
    const keyword = search.trim().toLowerCase()
    return list.filter((auction) => {
      const name = (auction.nft?.name ?? `Token #${auction.tokenId}`)?.toLowerCase?.() ?? ''
      return name.includes(keyword)
    })
  }, [list, search])

  const stats = useMemo(() => {
    if (!statsFromApi) {
      return { totalAuctions: 0, bidCount: 0, totalValue: '—' }
    }
    const { totalAuctions, bidCount, totalValue } = statsFromApi
    const displayTotalValue =
      !totalValue || totalValue === '0'
        ? '—'
        : (() => {
            try {
              return weiToEth(totalValue)
            } catch {
              return '—'
            }
          })()
    return {
      totalAuctions,
      bidCount,
      totalValue: displayTotalValue,
    }
  }, [statsFromApi])

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* 平台统计（当前进行中的拍卖列表维度） */}
      <div className="mb-6 grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:grid-cols-3">
        <div>
          <div className="text-xs text-zinc-500">拍卖总数（进行中）</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {stats.totalAuctions}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">出价总数（有出价的拍卖）</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {stats.bidCount}
          </div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">总价值（最高价合计）</div>
          <div className="mt-1 text-xl font-semibold text-white">
            {stats.totalValue}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">进行中的拍卖</h1>
        <div className="flex flex-1 items-center gap-3 sm:justify-end">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="按名称搜索 NFT"
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none sm:max-w-xs"
          />
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
      </div>

      {filteredList.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-zinc-400">
          暂无拍卖，去
          <Link to="/auctions/create" className="ml-1 text-[var(--accent)] hover:underline">
            创建拍卖
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredList.map((auction) => {
            const auctionId = auction.auctionId ?? auction.id
            const floor = minBidDisplayFromApi(auction.minBid, null).usd
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
                <p className="mt-1 text-sm text-zinc-500" title={auction.seller}>
                  卖家 {auction.sellerName ?? formatAddress(auction.seller)}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  结束 {formatTime(auction.endTime)}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  地板价: {floor}
                </p>
                {auction.highestBid && (
                  <p className="mt-2 text-sm text-[var(--accent)]">
                    当前最高价: {weiToEth(auction.highestBid.amount)}
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
