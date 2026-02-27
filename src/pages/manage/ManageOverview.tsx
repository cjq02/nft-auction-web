import { useQuery } from '@tanstack/react-query'
import { fetchOverview } from '../../api/overview'

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {sub != null && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

export function ManageOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['overview'],
    queryFn: fetchOverview,
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
      </div>
    )
  }

  const overview = data ?? null
  if (!overview) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-zinc-400">
        暂无数据
      </div>
    )
  }

  const { auction, nft } = overview

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-medium text-white">数据概览</h2>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">拍卖</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="拍卖总数" value={auction.total} />
          <StatCard label="进行中" value={auction.active} />
          <StatCard label="已结束" value={auction.ended} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">NFT 合约</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="已铸造数量 (totalSupply)"
            value={nft.totalSupply ?? '—'}
            sub={nft.totalSupply == null ? '未配置或链上读取失败' : undefined}
          />
          <StatCard
            label="下一 Token ID (nextTokenId)"
            value={nft.nextTokenId ?? '—'}
            sub={nft.nextTokenId == null ? '未配置或链上读取失败' : undefined}
          />
        </div>
      </div>
    </section>
  )
}
