import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { useUserAuctions } from '../hooks/useAuction'
import { useAuth } from '../hooks/useAuth'
import { ConnectGuard } from '../components/common/ConnectGuard'

function formatTime(ts: number | string | null | undefined) {
  if (!ts) return '-'
  const ms = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
  return isNaN(ms) ? '-' : new Date(ms).toLocaleDateString('zh-CN')
}

function weiToEth(wei: string) {
  try { return `${formatEther(BigInt(wei))} ETH` } catch { return wei }
}

export function Profile() {
  const { address } = useAccount()
  const { user, isNewUser, updateProfile, updateProfilePending, updateProfileError } = useAuth()
  const { data, isLoading, error } = useUserAuctions()

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

          {/* Right: auction list */}
          <div className="lg:col-span-2">
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
                  return (
                    <li key={auctionId}>
                      <Link
                        to={`/auctions/${auctionId}`}
                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--accent)]/50"
                      >
                        <div>
                          <span className="font-medium text-white">
                            {auction.nft?.name ?? `#${auction.tokenId}`}
                          </span>
                          <span className="ml-2 text-sm text-zinc-500">
                            {auction.status} · 结束 {formatTime(auction.endTime)}
                          </span>
                        </div>
                        <span className="text-sm text-zinc-400">
                          {weiToEth(auction.minBid)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </ConnectGuard>
    </div>
  )
}
