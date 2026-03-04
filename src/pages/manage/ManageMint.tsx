import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNftMint } from '../../hooks/useNftManage'
import { fetchUserList } from '../../api/auth'

const CUSTOM_ADDRESS_VALUE = '__custom__'

export function ManageMint() {
  const [selectedReceiver, setSelectedReceiver] = useState('')
  const [customAddress, setCustomAddress] = useState('')
  const [mintTokenURI, setMintTokenURI] = useState('')
  const { mint, error: mintError, isPending: mintPending, isSuccess: mintSuccess } = useNftMint()
  const { data: userList = [] } = useQuery({ queryKey: ['userList'], queryFn: fetchUserList })

  const resolvedAddress = selectedReceiver === CUSTOM_ADDRESS_VALUE ? customAddress.trim() : selectedReceiver

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedAddress || !mintTokenURI.trim()) return
    mint(resolvedAddress as `0x${string}`, mintTokenURI.trim())
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-medium text-white">铸造 NFT</h2>

      <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-4 text-sm text-zinc-400">
        <p className="font-medium text-zinc-300">填写说明</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li><strong className="text-zinc-300">接收地址</strong>：从下拉选择已注册用户（显示用户名），或选「自定义地址」后填写钱包地址。</li>
          <li><strong className="text-zinc-300">元数据 URI</strong>：指向「元数据 JSON」的链接。该 JSON 需包含 <code className="rounded bg-zinc-700 px-1">name</code>、<code className="rounded bg-zinc-700 px-1">description</code>、<code className="rounded bg-zinc-700 px-1">image</code> 等字段。可填 <code className="rounded bg-zinc-700 px-1">ipfs://Qm...</code> 或 <code className="rounded bg-zinc-700 px-1">https://...</code>。</li>
        </ul>
        <p className="mt-2 text-zinc-500">元数据示例：先上传图片到 IPFS/Pinata，再写一个 JSON（含 name、description、image），把 JSON 也上传到 IPFS，最后把该 JSON 的 URI 填到下方。</p>
      </div>

      <form onSubmit={handleMint} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm text-zinc-400">接收地址</label>
          <select
            value={selectedReceiver}
            onChange={(e) => setSelectedReceiver(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">请选择用户</option>
            {userList.map((u) => (
              <option key={u.walletAddress} value={u.walletAddress}>
                {u.username}
              </option>
            ))}
            <option value={CUSTOM_ADDRESS_VALUE}>自定义地址</option>
          </select>
          {selectedReceiver === CUSTOM_ADDRESS_VALUE && (
            <input
              type="text"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="0x1234...abcd（42 位以太坊地址）"
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
            />
          )}
        </div>
        <div>
          <label className="block text-sm text-zinc-400">元数据 URI (tokenURI)</label>
          <input
            type="text"
            value={mintTokenURI}
            onChange={(e) => setMintTokenURI(e.target.value)}
            placeholder="ipfs://Qm... 或 https://example.com/metadata/1.json"
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        {mintError && <p className="text-sm text-red-400">{mintError.message}</p>}
        {mintSuccess && <p className="text-sm text-[var(--accent)]">铸造成功</p>}
        <button
          type="submit"
          disabled={mintPending || !resolvedAddress || !mintTokenURI.trim()}
          className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {mintPending ? '请确认交易…' : '铸造'}
        </button>
      </form>
    </section>
  )
}
