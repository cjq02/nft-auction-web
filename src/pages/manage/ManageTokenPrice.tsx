import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { auctionAbi } from '../../contracts/abi'
import { AUCTION_CONTRACT_ADDRESS } from '../../contracts/addresses'
import { useAuctionOwner } from '../../hooks/useAuctionOwner'
import { SUPPORTED_TOKENS } from '../../config/supportedTokens'

const ZERO = '0x0000000000000000000000000000000000000000'

export function ManageTokenPrice() {
  const [tokenAddress, setTokenAddress] = useState('')
  const [priceFeedAddress, setPriceFeedAddress] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const { isOwner, isLoading: ownerLoading } = useAuctionOwner()
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const isValidTokenAddr = tokenAddress.trim().startsWith('0x') && tokenAddress.trim().length === 42
  const { data: existingFeed } = useReadContract({
    address: isValidTokenAddr ? AUCTION_CONTRACT_ADDRESS : undefined,
    abi: auctionAbi,
    functionName: 'tokenPriceFeeds',
    args: [tokenAddress.trim() as `0x${string}`],
  })
  const isPriceFeedSet = existingFeed && (existingFeed as string).toLowerCase() !== ZERO.toLowerCase()

  useEffect(() => {
    if (existingFeed && (existingFeed as string).toLowerCase() !== ZERO.toLowerCase()) {
      setPriceFeedAddress((existingFeed as string) ?? '')
    } else {
      setPriceFeedAddress('')
    }
  }, [existingFeed])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const token = tokenAddress.trim()
    const feed = priceFeedAddress.trim()
    if (!token || !feed) {
      setFormError('请填写代币地址和价格预言机地址')
      return
    }
    if (!token.startsWith('0x') || token.length !== 42) {
      setFormError('代币地址格式无效（需 0x 开头的 42 位地址）')
      return
    }
    if (!feed.startsWith('0x') || feed.length !== 42) {
      setFormError('价格预言机地址格式无效（需 0x 开头的 42 位地址）')
      return
    }
    writeContract({
      address: AUCTION_CONTRACT_ADDRESS,
      abi: auctionAbi,
      functionName: 'setTokenPriceFeed',
      args: [token as `0x${string}`, feed as `0x${string}`],
    })
  }

  if (ownerLoading) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-zinc-400">正在验证权限…</p>
      </section>
    )
  }

  if (!isOwner) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="text-amber-400">需要拍卖合约 Owner 权限才能设置代币价格预言机。</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-medium text-white">代币价格预言机</h2>

      <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-4 text-sm text-zinc-400">
        <p className="font-medium text-zinc-300">说明</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>创建 ERC20 出价拍卖前，需先为代币设置 Chainlink 价格预言机。</li>
          <li>代币需 decimals=18，否则出价会失败。</li>
          <li>预言机地址可在 <a href="https://docs.chain.link/data-feeds/price-feeds/addresses" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Chainlink 文档</a> 查询。</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm text-zinc-400">代币地址</label>
          {SUPPORTED_TOKENS.length > 0 ? (
            <select
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">请选择或手动填写</option>
              {SUPPORTED_TOKENS.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol} ({t.address.slice(0, 10)}...)
                </option>
              ))}
            </select>
          ) : null}
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x...（ERC20 代币合约地址）"
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        {isValidTokenAddr && (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 px-4 py-3">
            {isPriceFeedSet ? (
              <p className="text-sm text-[var(--accent)]">
                已设置价格预言机：<span className="font-mono text-zinc-300">{(existingFeed as string)?.slice(0, 10)}...{(existingFeed as string)?.slice(-8)}</span>
              </p>
            ) : (
              <p className="text-sm text-amber-500">该代币尚未设置价格预言机</p>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm text-zinc-400">价格预言机地址</label>
          <input
            type="text"
            value={priceFeedAddress}
            onChange={(e) => setPriceFeedAddress(e.target.value)}
            placeholder="0x...（Chainlink AggregatorV3 地址）"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        {(formError || writeError) && (
          <p className="text-sm text-red-400">{formError ?? writeError?.message}</p>
        )}
        {isSuccess && (
          <p className="text-sm text-[var(--accent)]">设置成功</p>
        )}
        <button
          type="submit"
          disabled={isPending || isConfirming || !tokenAddress.trim() || !priceFeedAddress.trim()}
          className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {(isPending || isConfirming) ? '请确认交易…' : '设置'}
        </button>
      </form>
    </section>
  )
}
