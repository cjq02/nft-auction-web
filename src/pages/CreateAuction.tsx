import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseUnits } from 'viem'
import { useAccount, useReadContract } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { useCreateAuction } from '../hooks/useAuction'
import { ConnectGuard } from '../components/common/ConnectGuard'
import { NFT_CONTRACT_ADDRESS, AUCTION_CONTRACT_ADDRESS } from '../contracts/addresses'
import { erc721Abi } from '../contracts/abi'
import { fetchNftList } from '../api/nft'

const PAYMENT_ETH = '0x0000000000000000000000000000000000000000' as `0x${string}`
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

type Step = 'approve' | 'create' | 'done'

const STEPS: { key: Step; label: string }[] = [
  { key: 'approve', label: '授权 NFT' },
  { key: 'create', label: '创建拍卖' },
  { key: 'done', label: '完成' },
]

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current)
  return (
    <ol className="mb-8 flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const done = i < idx
        const active = i === idx
        return (
          <li key={s.key} className="flex items-center">
            <div className="flex w-16 flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  done
                    ? 'bg-[var(--accent)] text-white'
                    : active
                      ? 'border-2 border-[var(--accent)] text-[var(--accent)]'
                      : 'border-2 border-zinc-700 text-zinc-600'
                }`}
              >
                {done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs ${active ? 'text-white' : done ? 'text-[var(--accent)]' : 'text-zinc-600'}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-5 h-0.5 w-12 ${i < idx ? 'bg-[var(--accent)]' : 'bg-zinc-700'}`} />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export function CreateAuction() {
  const navigate = useNavigate()
  const { address } = useAccount()

  // Step 1 state
  const nftContract = NFT_CONTRACT_ADDRESS
  const [tokenId, setTokenId] = useState('')

  // Step 2 state
  const [durationDays, setDurationDays] = useState('7')
  const [minBidUsd, setMinBidUsd] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const [step, setStep] = useState<Step>('approve')

  // Fetch user's NFT list for dropdown
  const contractForList = NFT_CONTRACT_ADDRESS !== ZERO_ADDRESS ? NFT_CONTRACT_ADDRESS : undefined
  const { data: nftList = [] } = useQuery({
    queryKey: ['nftList', contractForList],
    queryFn: () => fetchNftList(contractForList),
    enabled: !!contractForList,
  })
  const myNfts = useMemo(() => {
    if (!address) return []
    const lower = address.toLowerCase()
    return nftList.filter((item) => item.owner?.toLowerCase() === lower)
  }, [nftList, address])

  // Auto-detect if tokenId is already approved → skip step 1
  const tokenIdBigInt = tokenId ? BigInt(tokenId) : undefined
  const { data: approvedAddress } = useReadContract({
    address: nftContract as `0x${string}`,
    abi: erc721Abi,
    functionName: 'getApproved',
    args: tokenIdBigInt !== undefined ? [tokenIdBigInt] : undefined,
    query: { enabled: !!tokenId && !!nftContract },
  })
  const alreadyApproved =
    !!approvedAddress &&
    (approvedAddress as string).toLowerCase() === AUCTION_CONTRACT_ADDRESS.toLowerCase()

  useEffect(() => {
    if (alreadyApproved && step === 'approve') setStep('create')
  }, [alreadyApproved, step])

  const {
    approveNft,
    create,
    approveError,
    createError,
    isApprovePending,
    isApproveSuccess,
    isCreatePending,
    isCreateSuccess,
  } = useCreateAuction()

  useEffect(() => {
    if (isApproveSuccess) setStep('create')
  }, [isApproveSuccess])

  useEffect(() => {
    if (isCreateSuccess) {
      setStep('done')
      const t = setTimeout(() => navigate('/'), 2000)
      return () => clearTimeout(t)
    }
  }, [isCreateSuccess, navigate])

  const handleApprove = () => {
    if (!tokenId) return
    approveNft(BigInt(tokenId), nftContract as `0x${string}`)
  }

  const handleCreate = () => {
    setFormError(null)
    try {
      const durationSec = BigInt(Number(durationDays) * 24 * 60 * 60)
      // 最低出价单位为美元，合约要求 18 位小数
      const minBidUSD = parseUnits(minBidUsd.trim(), 18)
      if (minBidUSD === 0n) {
        setFormError('请输入大于 0 的最低出价')
        return
      }
      create({
        nftContract: nftContract as `0x${string}`,
        tokenId: BigInt(tokenId),
        duration: durationSec,
        minBidUSD,
        paymentToken: PAYMENT_ETH,
      })
    } catch (e) {
      setFormError(
        (e as Error).message?.includes('fraction')
          ? '请输入有效的金额（例如 100 或 99.5）'
          : (e as Error).message || '无效输入',
      )
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-white">创建拍卖</h1>
      <ConnectGuard>
        <StepIndicator current={step} />

        {/* Step 1: Approve */}
        {step === 'approve' && (
          <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-base font-medium text-white">第一步：授权 NFT 给拍卖合约</h2>
            <p className="text-sm text-zinc-500">
              选择要拍卖的 NFT，并授权拍卖合约在拍卖结束时转移该 NFT。
            </p>

            <div>
              <label className="block text-sm text-zinc-400">选择要拍卖的 NFT</label>
              {myNfts.length > 0 ? (
                <select
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="">请选择 NFT</option>
                  {myNfts.map((item) => (
                    <option key={item.tokenId} value={String(item.tokenId)}>
                      {item.name ?? `Token #${item.tokenId}`} (ID: {item.tokenId})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  placeholder="手动输入 Token ID"
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
                />
              )}
              {myNfts.length === 0 && address && (
                <p className="mt-1 text-xs text-zinc-500">
                  当前钱包暂无 NFT，或列表加载中，可手动输入 Token ID
                </p>
              )}
            </div>

            {approveError && (
              <p className="text-sm text-red-400">{approveError.message}</p>
            )}

            <button
              type="button"
              onClick={handleApprove}
              disabled={isApprovePending || !tokenId}
              className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {isApprovePending ? '等待钱包确认...' : '授权 NFT'}
            </button>
          </div>
        )}

        {/* Step 2: Create Auction */}
        {step === 'create' && (
          <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
            <h2 className="text-base font-medium text-white">第二步：设置拍卖参数</h2>

            {/* Summary of approved NFT */}
            <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3">
              <p className="text-sm text-zinc-400">
                已授权 NFT：
                <span className="ml-1 font-medium text-white">Token #{tokenId}</span>
              </p>
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
              <label className="block text-sm text-zinc-400">最低出价 (USD)</label>
              <input
                type="text"
                value={minBidUsd}
                onChange={(e) => setMinBidUsd(e.target.value)}
                placeholder="100"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <p className="text-sm text-zinc-500">支付方式：ETH</p>

            {(formError || createError) && (
              <p className="text-sm text-red-400">{formError ?? createError?.message}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('approve')}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-white"
              >
                上一步
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreatePending || !minBidUsd.trim()}
                className="flex-1 rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {isCreatePending ? '等待钱包确认...' : '创建拍卖'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/20">
              <svg className="h-7 w-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-white">拍卖创建成功！</p>
            <p className="mt-1 text-sm text-zinc-500">正在跳转到首页...</p>
          </div>
        )}
      </ConnectGuard>
    </div>
  )
}
