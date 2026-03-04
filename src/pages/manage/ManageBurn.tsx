import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNftBurn } from '../../hooks/useNftManage'
import { useToast } from '../../hooks/use-toast'

export function ManageBurn() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [burnTokenId, setBurnTokenId] = useState('')
  const { burn, error: burnError, isPending: burnPending, isSuccess: burnSuccess } = useNftBurn()

  useEffect(() => {
    if (!burnSuccess) return
    toast({
      title: '销毁成功',
      description: '正在跳转到已铸造…',
    })
    const t = setTimeout(() => {
      navigate('/manage/list', { replace: true })
    }, 1500)
    return () => clearTimeout(t)
  }, [burnSuccess, navigate, toast])

  const handleBurn = (e: React.FormEvent) => {
    e.preventDefault()
    const id = burnTokenId.trim()
    if (!id) return
    burn(BigInt(id))
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="mb-4 text-lg font-medium text-white">销毁 NFT</h2>
        <p className="mb-4 text-sm text-zinc-500">
          仅当您是该 Token 的持有人或是合约 Owner 时可销毁。
        </p>
        <form onSubmit={handleBurn} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm text-zinc-400">Token ID</label>
            <input
              type="text"
              value={burnTokenId}
              onChange={(e) => setBurnTokenId(e.target.value)}
              placeholder="1"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          {burnError && <p className="text-sm text-red-400">{burnError.message}</p>}
          <button
            type="submit"
            disabled={burnPending || !burnTokenId.trim()}
            className="w-full rounded-lg border border-red-500/50 bg-red-500/10 py-2 font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            {burnPending ? '请确认交易…' : '销毁'}
          </button>
      </form>
    </section>
  )
}
