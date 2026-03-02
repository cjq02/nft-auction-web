import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useAuth } from '../../hooks/useAuth'
import { useNftOwner } from '../../hooks/useNftOwner'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error: connectError, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const { isOwner } = useNftOwner()
  const { user, isLoggedIn, connectWallet, connectWalletPending, logout } = useAuth()

  // 钱包连接成功后自动调后端 /api/auth/wallet 获取 JWT
  useEffect(() => {
    if (isConnected && address && !isLoggedIn) {
      connectWallet(address).catch((err) =>
        console.warn('[Header] wallet auth failed', err),
      )
    }
  }, [isConnected, address, isLoggedIn, connectWallet])

  // 钱包断开时同步登出
  useEffect(() => {
    if (!isConnected && isLoggedIn) {
      logout()
    }
  }, [isConnected, isLoggedIn, logout])

  const handleDisconnect = () => {
    logout()
    disconnect()
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-semibold text-white">
          NFT Auction
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm text-zinc-400 hover:text-white">
            首页
          </Link>
          <Link to="/auctions/create" className="text-sm text-zinc-400 hover:text-white">
            创建拍卖
          </Link>
          {isOwner && (
            <Link to="/manage" className="text-sm text-amber-400 hover:text-amber-300">
              管理
            </Link>
          )}

          {isConnected ? (
            <>
              <Link to="/profile" className="text-sm text-zinc-400 hover:text-white">
                个人中心
              </Link>

              {/* 地址 + 登录状态 */}
              <div className="flex flex-col items-end">
                <span className="shrink-0 font-mono text-xs text-zinc-400 whitespace-nowrap">
                  {address}
                </span>
                {connectWalletPending ? (
                  <span className="text-xs text-zinc-500">登录中...</span>
                ) : isLoggedIn ? (
                  <span className="text-xs text-emerald-500">
                    {user?.username ?? '已登录'}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-600">未登录</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm text-white hover:bg-zinc-600"
              >
                断开
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isConnecting}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {isConnecting ? '连接中...' : '连接钱包'}
            </button>
          )}
        </nav>
      </div>

      {connectError && (
        <div className="mx-auto max-w-6xl px-4 py-2 text-sm text-red-400">
          {connectError.message.includes('Provider not found') ||
          connectError.message.includes('provider') ? (
            <>
              未检测到钱包。请安装{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-red-300"
              >
                MetaMask
              </a>{' '}
              等浏览器扩展后再连接。
            </>
          ) : (
            connectError.message
          )}
        </div>
      )}
    </header>
  )
}
