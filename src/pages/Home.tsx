import { Link } from 'react-router-dom'
import { useAuctionList } from '../hooks/useAuction'

function formatTime(s: string) {
  const d = new Date(s)
  return d.toLocaleString('zh-CN')
}

function formatAddress(addr: string) {
  if (!addr) return '-'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function Home() {
  const { data, isLoading, error } = useAuctionList({ status: 'active', limit: 20 })

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

  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
      ? data
      : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">进行中的拍卖</h1>
      {list.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-zinc-400">
          暂无拍卖，去
          <Link to="/auctions/create" className="ml-1 text-[var(--accent)] hover:underline">
            创建拍卖
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((auction) => (
            <Link
              key={auction.id}
              to={`/auctions/${auction.id}`}
              className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition hover:border-[var(--accent)]/50"
            >
              <div className="aspect-square bg-zinc-800">
                {auction.nft?.image ? (
                  <img
                    src={auction.nft.image}
                    alt={auction.nft.name ?? 'NFT'}
                    className="h-full w-full object-cover"
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
                    当前最高: {auction.highestBid.amount} wei
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
