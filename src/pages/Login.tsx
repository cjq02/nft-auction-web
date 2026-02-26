import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const { login, loginError, isLoading } = useAuth()
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return
    try {
      await login({ address, password: password || undefined })
      navigate('/profile')
    } catch {
      // error from mutation
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-white">登录</h1>
      {!isConnected ? (
        <p className="text-zinc-400">请先连接钱包</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
        >
          <p className="mb-4 text-sm text-zinc-500">
            地址: {address?.slice(0, 6)}...{address?.slice(-4)}
          </p>
          <div>
            <label className="block text-sm text-zinc-400">密码（如已注册）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          {loginError && (
            <p className="mt-2 text-sm text-red-400">{(loginError as Error).message}</p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-zinc-500">
        还没有账号？ <Link to="/register" className="text-[var(--accent)] hover:underline">注册</Link>
      </p>
    </div>
  )
}
