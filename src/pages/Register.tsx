import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useAuth } from '../hooks/useAuth'

export function Register() {
  const navigate = useNavigate()
  const { address, isConnected } = useAccount()
  const { register, registerError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) return
    try {
      await register({ address, username: username || undefined, password: password || undefined })
      navigate('/profile')
    } catch {
      //
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold text-white">注册</h1>
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
          <div className="mb-4">
            <label className="block text-sm text-zinc-400">用户名（可选）</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">密码（可选）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          {registerError && (
            <p className="mt-2 text-sm text-red-400">{(registerError as Error).message}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            注册
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-zinc-500">
        已有账号？ <Link to="/login" className="text-[var(--accent)] hover:underline">登录</Link>
      </p>
    </div>
  )
}
