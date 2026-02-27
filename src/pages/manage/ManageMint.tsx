import { useState } from 'react'
import { useNftMint } from '../../hooks/useNftManage'

export function ManageMint() {
  const [mintTo, setMintTo] = useState('')
  const [mintTokenURI, setMintTokenURI] = useState('')
  const { mint, error: mintError, isPending: mintPending, isSuccess: mintSuccess } = useNftMint()

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mintTo.trim() || !mintTokenURI.trim()) return
    mint(mintTo.trim() as `0x${string}`, mintTokenURI.trim())
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-medium text-white">铸造 NFT</h2>
      <form onSubmit={handleMint} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm text-zinc-400">接收地址</label>
          <input
            type="text"
            value={mintTo}
            onChange={(e) => setMintTo(e.target.value)}
            placeholder="0x..."
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-400">元数据 URI (tokenURI)</label>
          <input
            type="text"
            value={mintTokenURI}
            onChange={(e) => setMintTokenURI(e.target.value)}
            placeholder="ipfs://Qm... 或 https://..."
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        {mintError && <p className="text-sm text-red-400">{mintError.message}</p>}
        {mintSuccess && <p className="text-sm text-[var(--accent)]">铸造成功</p>}
        <button
          type="submit"
          disabled={mintPending || !mintTo.trim() || !mintTokenURI.trim()}
          className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {mintPending ? '请确认交易…' : '铸造'}
        </button>
      </form>
    </section>
  )
}
