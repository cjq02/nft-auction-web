import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchOverview } from '../../api/overview'
import { getTokenByAddress } from '../../config/supportedTokens'
import { formatEther, formatUnits } from 'viem'

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
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['overview'],
    queryFn: fetchOverview,
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['overview'] })
  }

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

  const formatEthEquivalent = (s: string | undefined) => {
    if (s == null || s === '') return '0'
    const n = Number(s)
    if (!Number.isFinite(n) || n <= 0) return '0'
    if (n < 0.01) return Number(s).toFixed(6)
    return n >= 1 ? n.toFixed(2) : n.toFixed(4)
  }

  const feeEthDisplay = (() => {
    const raw = (auction.feeTotalEth ?? '').trim().split('.')[0] || '0'
    if (raw === '' || raw === '0' || /^0+$/.test(raw)) return '0 ETH'
    let wei: bigint
    try {
      if (/e/i.test(raw)) {
        const n = Number(raw)
        if (!Number.isFinite(n) || n < 0) return '0 ETH'
        wei = BigInt(Math.floor(n))
      } else {
        wei = BigInt(raw)
      }
      if (wei === 0n) return '0 ETH'
      const ethStr = formatEther(wei)
      const ethNum = Number(ethStr)
      const formatted = ethNum > 0 && ethNum < 0.01 ? Number(ethStr).toFixed(6) : ethStr
      return `${formatted} ETH`
    } catch {
      return '0 ETH'
    }
  })()

  const feeTokens = Array.isArray(auction.feeByToken) ? auction.feeByToken : []

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-white">数据概览</h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-zinc-400 hover:border-[var(--accent)]/50 hover:text-white disabled:opacity-50"
        >
          {isFetching ? '刷新中…' : '刷新'}
        </button>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">拍卖</h3>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="拍卖总数" value={auction.total} />
          <StatCard label="进行中" value={auction.active} />
          <StatCard label="已结束" value={auction.ended} />
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <p className="text-sm text-zinc-400">平台手续费</p>
            <p className="mt-0.5 text-xs text-zinc-500">ETH 支付 + 各代币支付累加</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {auction.feeTotalUsd != null && auction.feeTotalUsd !== ''
                ? `$${Number(auction.feeTotalUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              美元 · 折合 {formatEthEquivalent(auction?.feeTotalEthEquivalent ?? '')} ETH
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
          <p className="mb-3 text-zinc-400">手续费明细（ETH 与各代币分别）</p>
          <ul className="space-y-2">
            <li className="flex justify-between text-zinc-300">
              <span>ETH</span>
              <span>
                {feeEthDisplay}
                {auction.feeTotalEthUsd != null && auction.feeTotalEthUsd !== ''
                  ? ` · $${Number(auction.feeTotalEthUsd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : ''}
              </span>
            </li>
            {feeTokens.map((t) => {
              const tokenInfo = getTokenByAddress(t.token)
              const name = tokenInfo?.symbol ?? `${t.token.slice(0, 6)}...${t.token.slice(-4)}`
              let amountDisplay = t.total
              try {
                const decimals = tokenInfo?.decimals ?? 18
                amountDisplay = `${formatUnits(BigInt(t.total), decimals)} ${tokenInfo?.symbol ?? '代币'}`
              } catch {
                amountDisplay = `${t.total} (原始)`
              }
              const usdDisplay =
                t.usd != null && t.usd !== ''
                  ? ` · $${Number(t.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : ''
              return (
                <li key={t.token} className="flex justify-between text-zinc-300">
                  <span>{name}</span>
                  <span>{amountDisplay}{usdDisplay}</span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-zinc-400">NFT 合约</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="已铸造数量 (totalSupply)"
            value={nft.totalSupply ?? '—'}
            sub={
              nft.totalSupply == null
                ? '未配置或链上读取失败'
                : '历史上铸造过的总数'
            }
          />
          <StatCard
            label="已销毁数量"
            value={nft.burnedCount ?? '—'}
            sub={nft.burnedCount == null ? '未配置或链上读取失败' : undefined}
          />
          <StatCard
            label="当前存在数量"
            value={nft.currentSupply ?? '—'}
            sub={
              nft.currentSupply != null
                ? 'totalSupply − 已销毁'
                : nft.totalSupply == null && nft.burnedCount == null
                  ? '未配置或链上读取失败'
                  : undefined
            }
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
