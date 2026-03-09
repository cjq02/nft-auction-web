import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { useUserAuctions } from '../hooks/useAuction'
import { useAuth } from '../hooks/useAuth'
import { ConnectGuard } from '../components/common/ConnectGuard'
import { fetchMyNfts } from '../api/nft'
import { NFT_CONTRACT_ADDRESS } from '../contracts/addresses'
import { toDisplayImageUrl } from '../utils/ipfs'
import { minBidDisplayFromApi } from '../utils/auctionDisplay'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function formatTime(ts: number | string | null | undefined) {
  if (!ts) return '-'
  const ms = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
  return isNaN(ms) ? '-' : new Date(ms).toLocaleDateString('zh-CN')
}

function weiToEth(wei: string) {
  try { return `${formatEther(BigInt(wei))} ETH` } catch { return wei }
}

function normalizeAuctionStatus(status?: string, endTime?: number | string | null) {
  if (status === 'Active' || status === 'Ended' || status === 'Cancelled') return status
  const end = typeof endTime === 'number' ? endTime : Number(endTime ?? 0)
  if (!end || Number.isNaN(end)) return 'Active'
  return Date.now() / 1000 >= end ? 'Ended' : 'Active'
}

function StatusBadge({ status }: { status?: string }) {
  const s = status === 'Ended' || status === 'Cancelled' || status === 'Active' ? status : 'Active'
  const cls =
    s === 'Active'
      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
      : s === 'Ended'
        ? 'border-zinc-500/30 bg-zinc-500/15 text-zinc-300'
        : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
  const label = s === 'Active' ? '进行中' : s === 'Ended' ? '已结束' : '已取消'
  return <span className={`rounded-full border px-2 py-0.5 text-xs ${cls}`}>{label}</span>
}

export function Profile() {
  const { address } = useAccount()
  const { user, isNewUser, updateProfile, updateProfilePending, updateProfileError } = useAuth()
  const { data, isLoading, error } = useUserAuctions()

  const contractForList = NFT_CONTRACT_ADDRESS !== ZERO_ADDRESS ? NFT_CONTRACT_ADDRESS : undefined
  const { data: myNfts = [], isLoading: nftLoading } = useQuery({
    queryKey: ['myNfts', address, contractForList],
    queryFn: () => fetchMyNfts(address!, contractForList),
    enabled: !!address && !!contractForList,
  })

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setUsername(isNewUser ? '' : (user.username ?? ''))
      setEmail(user.email ?? '')
    }
  }, [user, isNewUser])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaveSuccess(false)
    try {
      await updateProfile({
        username: username.trim() || undefined,
        email: email.trim(),
      })
      setSaveSuccess(true)
    } catch (err) {
      setFormError((err as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">个人中心</h1>
      <ConnectGuard>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: user info + edit form */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
              {/* Wallet address */}
              <div className="mb-4 break-all text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/20 text-2xl text-[var(--accent)]">
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <p className="font-mono text-xs text-zinc-500">{address}</p>
              </div>

              {isNewUser && (
                <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  首次连接钱包，请完善个人信息
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400">用户名</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="3～50 字符"
                    minLength={3}
                    maxLength={50}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600 focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400">邮箱（选填）</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="留空则清除邮箱"
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-600 focus:border-[var(--accent)] focus:outline-none"
                  />
                </div>

                {(formError || updateProfileError) && (
                  <p className="text-sm text-red-400">
                    {formError ?? (updateProfileError as Error)?.message}
                  </p>
                )}
                {saveSuccess && (
                  <p className="text-sm text-emerald-400">保存成功</p>
                )}

                <button
                  type="submit"
                  disabled={updateProfilePending || !username.trim()}
                  className="w-full rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {updateProfilePending ? '保存中...' : '保存'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: auction list + NFT list */}
          <div className="lg:col-span-2 space-y-8">
            <div>
            <h2 className="mb-4 text-lg font-medium text-white">我的拍卖</h2>
            {isLoading ? (
              <div className="h-40 animate-pulse rounded-xl bg-[var(--card)]" />
            ) : error ? (
              <p className="text-red-400">加载失败: {(error as Error).message}</p>
            ) : !data?.items?.length ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-zinc-500">
                暂无拍卖，
                <Link to="/auctions/create" className="ml-1 text-[var(--accent)] hover:underline">
                  去创建
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {data.items.map((auction) => {
                  const auctionId = auction.auctionId ?? auction.id
                  const status = normalizeAuctionStatus(auction.status, auction.endTime)
                  return (
                    <li key={auctionId}>
                      <Link
                        to={`/auctions/${auctionId}`}
                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {auction.nft?.name ?? `#${auction.tokenId}`}
                          </span>
                          <StatusBadge status={status} />
                          <span className="text-sm text-zinc-500">
                            结束 {formatTime(auction.endTime)}
                          </span>
                        </div>
                        <span className="text-sm text-zinc-400">
                          {(() => {
                            const { usd, eth } = minBidDisplayFromApi(auction.minBid, auction.minBidEth)
                            return eth === '—' ? usd : `${usd} · ${eth}`
                          })()}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
            </div>

            {/* My NFTs */}
            {contractForList && (
              <div>
                <h2 className="mb-4 text-lg font-medium text-white">我的 NFT</h2>
                {nftLoading ? (
                  <div className="h-32 animate-pulse rounded-xl bg-[var(--card)]" />
                ) : myNfts.length === 0 ? (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-zinc-500">
                    暂无 NFT
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {myNfts.map((item) => {
                      const imageUrl = toDisplayImageUrl(item.image ?? item.tokenUri ?? undefined)
                      return (
                        <div
                          key={item.tokenId}
                          className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]"
                        >
                          <div className="aspect-square bg-zinc-800">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={item.name ?? `#${item.tokenId}`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-3xl text-zinc-600">
                                #{item.tokenId}
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="truncate font-medium text-white">
                              {item.name ?? `Token #${item.tokenId}`}
                            </p>
                            {item.description && (
                              <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                                {item.description}
                              </p>
                            )}
                            <Link
                              to="/auctions/create"
                              className="mt-3 block w-full rounded-lg bg-[var(--accent)]/10 py-1.5 text-center text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20"
                            >
                              去拍卖
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ConnectGuard>
    </div>
  )
}
