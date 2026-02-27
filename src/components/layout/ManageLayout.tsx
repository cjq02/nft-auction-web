import { NavLink, Outlet } from 'react-router-dom'
import { ConnectGuard } from '../common/ConnectGuard'
import { useNftOwner } from '../../hooks/useNftOwner'

const navItems = [
  { to: '/manage/overview', label: '数据概览' },
  { to: '/manage/mint', label: '铸造 NFT' },
  { to: '/manage/burn', label: '销毁 NFT' },
]

export function ManageLayout() {
  const { isOwner, isLoading } = useNftOwner()

  return (
    <ConnectGuard>
      {isLoading ? (
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-zinc-400">
          正在验证权限…
        </div>
      ) : !isOwner ? (
        <div className="mx-auto max-w-4xl px-4 py-12 text-center text-zinc-400">
          当前钱包不是 NFT 合约 Owner，无管理权限。
        </div>
      ) : (
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="mb-6 text-2xl font-semibold text-white">NFT 管理</h1>
          <nav className="mb-6 flex gap-1 border-b border-[var(--border)]">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'border-b-2 border-[var(--accent)] text-[var(--accent)]'
                      : 'text-zinc-400 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Outlet />
        </div>
      )}
    </ConnectGuard>
  )
}
