import { Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useUserAuctions } from '../hooks/useAuction'
import { ConnectGuard } from '../components/common/ConnectGuard'

export function Profile() {
  const { address } = useAccount()
  const { data, isLoading, error } = useUserAuctions()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">个人中心</h1>
      <ConnectGuard>
        {!address ? null : (
          <p className="mb-4 text-zinc-400">
            钱包地址: <span className="font-mono text-white">{address}</span>
          </p>
        )}
        <h2 className="mb-4 text-lg font-medium text-white">我的拍卖</h2>
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-xl bg-[var(--card)]" />
        ) : error ? (
          <p className="text-red-400">加载失败: {(error as Error).message}</p>
        ) : !data?.items?.length ? (
          <p className="text-zinc-500">
            暂无拍卖，
            <Link to="/auctions/create" className="ml-1 text-[var(--accent)] hover:underline">
              去创建
            </Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {data.items.map((auction) => (
              <li key={auction.id}>
                <Link
                  to={`/auctions/${auction.id}`}
                  className="block rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]/50"
                >
                  <span className="font-medium text-white">
                    {auction.nft?.name ?? `#${auction.tokenId}`}
                  </span>
                  <span className="ml-2 text-sm text-zinc-500">
                    {auction.status} · 结束 {new Date(auction.endTime).toLocaleDateString('zh-CN')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </ConnectGuard>
    </div>
  )
}
