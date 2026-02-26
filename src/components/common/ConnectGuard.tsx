import { useAccount } from 'wagmi'
import { ReactNode } from 'react'

interface ConnectGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ConnectGuard({ children, fallback }: ConnectGuardProps) {
  const { isConnected } = useAccount()
  if (!isConnected) {
    return (
      fallback ?? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
          <p className="text-zinc-400">请先连接钱包</p>
        </div>
      )
    )
  }
  return <>{children}</>
}
