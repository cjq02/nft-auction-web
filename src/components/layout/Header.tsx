import { Link } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useAuth } from '../../hooks/useAuth'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { isLoggedIn, logout } = useAuth()

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
          {isConnected ? (
            <>
              <Link to="/profile" className="text-sm text-zinc-400 hover:text-white">
                个人中心
              </Link>
              <span className="max-w-[120px] truncate text-xs text-zinc-500">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button
                type="button"
                onClick={() => disconnect()}
                className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm text-white hover:bg-zinc-600"
              >
                断开
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isPending}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {isPending ? '连接中...' : '连接钱包'}
            </button>
          )}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="text-sm text-zinc-400 hover:text-white"
            >
              退出登录
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm text-zinc-400 hover:text-white">
                登录
              </Link>
              <Link to="/register" className="text-sm text-zinc-400 hover:text-white">
                注册
              </Link>
            </>
          )}
        </nav>
      </div>
      {error && (
        <div className="mx-auto max-w-6xl px-4 py-2 text-sm text-red-400">
          {error.message.includes('Provider not found') || error.message.includes('provider') ? (
            <>
              未检测到钱包。请安装{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-red-300"
              >
                MetaMask
              </a>
              等浏览器扩展后再连接。
            </>
          ) : (
            error.message
          )}
        </div>
      )}
    </header>
  )
}
