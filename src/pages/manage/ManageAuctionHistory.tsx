import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatEther, formatUnits } from 'viem'
import { fetchAuctionList, type AuctionListItem, type ListResponse } from '../../api/auction'
import { getTokenByAddress, isEthPayment } from '../../config/supportedTokens'

const PAGE_SIZE = 20

function formatTime(ts: number | string | null | undefined) {
  if (!ts) return '—'
  const ms = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
  return isNaN(ms) ? '—' : new Date(ms).toLocaleString('zh-CN')
}

function formatAddress(addr: string) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatHighestBid(auction: {
  highestBid?: { amount: string; isETH?: boolean; isEth?: boolean }
  paymentToken: string | null
}) {
  const hb = auction.highestBid
  if (!hb || !hb.amount) return '—'
  const isEth = isEthPayment(auction.paymentToken) || hb.isETH === true || hb.isEth === true
  try {
    const amount = BigInt(hb.amount)
    if (amount === 0n) return '—'
    if (isEth) return `${formatEther(amount)} ETH`
    const token = getTokenByAddress(auction.paymentToken)
    const decimals = token?.decimals ?? 18
    const symbol = token?.symbol ?? '代币'
    return `${formatUnits(amount, decimals)} ${symbol}`
  } catch {
    return hb.amount
  }
}

function formatFee(auction: AuctionListItem) {
  if (auction.feeAmount == null || auction.feeAmount === '' || auction.feeAmount === '0') return '—'
  try {
    const amt = BigInt(auction.feeAmount)
    if (amt === 0n) return '—'
    if (auction.feeIsETH) return `${formatEther(amt)} ETH`
    const token = getTokenByAddress(auction.paymentToken)
    const decimals = token?.decimals ?? 18
    const symbol = token?.symbol ?? '代币'
    return `${formatUnits(amt, decimals)} ${symbol}`
  } catch {
    return auction.feeAmount
  }
}

export function ManageAuctionHistory() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['auctions', { status: 'ended' as const, limit: PAGE_SIZE, page }],
    queryFn: () => fetchAuctionList({ status: 'ended', limit: PAGE_SIZE, page }) as Promise<ListResponse<AuctionListItem>>,
  })

  const list = Array.isArray(data?.items) ? data.items : []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['auctions'] })
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

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium text-white">历史拍卖列表</h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm text-zinc-400 hover:border-[var(--accent)]/50 hover:text-white disabled:opacity-50"
        >
          {isFetching ? '刷新中…' : '刷新'}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-zinc-400">
          暂无已结束的拍卖
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-zinc-400">
                  <th className="p-3 font-medium">拍卖 ID</th>
                  <th className="p-3 font-medium">NFT</th>
                  <th className="p-3 font-medium">卖家</th>
                  <th className="p-3 font-medium">结束时间</th>
                  <th className="p-3 font-medium">最高出价</th>
                  <th className="p-3 font-medium">手续费</th>
                  <th className="p-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map((auction: AuctionListItem) => {
                  const id = auction.auctionId ?? (auction as { id?: number }).id
                  return (
                    <tr
                      key={id}
                      className="border-b border-[var(--border)] last:border-b-0 text-zinc-300"
                    >
                      <td className="p-3 font-mono">{id}</td>
                      <td className="p-3">
                        {auction.nft?.name ?? `Token #${auction.tokenId}`}
                      </td>
                      <td className="p-3" title={auction.seller}>
                        {auction.sellerName ?? formatAddress(auction.seller)}
                      </td>
                      <td className="p-3 whitespace-nowrap">{formatTime(auction.endTime)}</td>
                      <td className="p-3">{formatHighestBid(auction)}</td>
                      <td className="p-3">{formatFee(auction)}</td>
                      <td className="p-3">
                        <Link
                          to={`/auctions/${id}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          详情
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
              <span>
                共 {total} 条，第 {page} / {totalPages} 页
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[var(--card)] disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                  className="rounded border border-[var(--border)] px-2 py-1 hover:bg-[var(--card)] disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
