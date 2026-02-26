import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateAuction } from '../hooks/useAuction'
import { ConnectGuard } from '../components/common/ConnectGuard'
import { NFT_CONTRACT_ADDRESS } from '../contracts/addresses'

const PAYMENT_ETH = '0x0000000000000000000000000000000000000000' as `0x${string}`

export function CreateAuction() {
  const navigate = useNavigate()
  const [nftContract, setNftContract] = useState<string>(NFT_CONTRACT_ADDRESS)
  const [tokenId, setTokenId] = useState('')
  const [durationDays, setDurationDays] = useState('7')
  const [minBidUSD, setMinBidUSD] = useState('')
  const [step, setStep] = useState<'form' | 'approve' | 'create'>('form')

  const {
    approveNft,
    create,
    error: txError,
    isPending,
    isSuccess,
  } = useCreateAuction()

  useEffect(() => {
    if (step === 'form' && isSuccess) setStep('approve')
  }, [step, isSuccess])

  const handleApprove = () => {
    const id = BigInt(tokenId)
    approveNft(id, nftContract as `0x${string}`)
  }

  const handleCreate = () => {
    const durationSec = BigInt(Number(durationDays) * 24 * 60 * 60)
    const minBid = BigInt(minBidUSD)
    create({
      nftContract: nftContract as `0x${string}`,
      tokenId: BigInt(tokenId),
      duration: durationSec,
      minBidUSD: minBid,
      paymentToken: PAYMENT_ETH,
    })
    setStep('create')
  }

  if (isSuccess) {
    setTimeout(() => navigate('/'), 1500)
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-lg text-[var(--accent)]">拍卖创建成功，正在跳转...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">创建拍卖</h1>
      <ConnectGuard>
        <form
          className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <div>
            <label className="block text-sm text-zinc-400">NFT 合约地址</label>
            <input
              type="text"
              value={nftContract}
              onChange={(e) => setNftContract(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">Token ID</label>
            <input
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">拍卖时长（天）</label>
            <input
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">最低出价 (USD, 18 位小数)</label>
            <input
              type="text"
              value={minBidUSD}
              onChange={(e) => setMinBidUSD(e.target.value)}
              placeholder="1000000000000000000"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <p className="text-sm text-zinc-500">支付方式：ETH</p>

          {txError && (
            <p className="text-sm text-red-400">{txError.message}</p>
          )}

          {step === 'form' && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending || !tokenId || !minBidUSD}
              className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {isPending ? '请确认授权...' : '1. 授权 NFT 给拍卖合约'}
            </button>
          )}
          {step === 'approve' && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {isPending ? '请确认交易...' : '2. 创建拍卖'}
            </button>
          )}
        </form>
      </ConnectGuard>
    </div>
  )
}
