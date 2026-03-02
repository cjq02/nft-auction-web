import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { parseEther } from 'viem'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { useCreateAuction } from '../hooks/useAuction'
import { ConnectGuard } from '../components/common/ConnectGuard'
import { NFT_CONTRACT_ADDRESS } from '../contracts/addresses'
import { fetchNftList } from '../api/nft'

const PAYMENT_ETH = '0x0000000000000000000000000000000000000000' as `0x${string}`

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function CreateAuction() {
  const navigate = useNavigate()
  const { address } = useAccount()
  const [nftContract, setNftContract] = useState<string>(NFT_CONTRACT_ADDRESS)
  const [tokenId, setTokenId] = useState('')
  const [durationDays, setDurationDays] = useState('7')
  const [minBidEth, setMinBidEth] = useState('')
  const [step, setStep] = useState<'form' | 'approve' | 'create'>('form')
  const [formError, setFormError] = useState<string | null>(null)

  const contractForList =
    NFT_CONTRACT_ADDRESS !== ZERO_ADDRESS ? NFT_CONTRACT_ADDRESS : undefined
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
    setFormError(null)
    try {
      const durationSec = BigInt(Number(durationDays) * 24 * 60 * 60)
      const minBidWei = parseEther(minBidEth.trim())
      create({
        nftContract: nftContract as `0x${string}`,
        tokenId: BigInt(tokenId),
        duration: durationSec,
        minBidUSD: minBidWei,
        paymentToken: PAYMENT_ETH,
      })
      setStep('create')
    } catch (e) {
      setFormError((e as Error).message?.includes('fraction') ? '请输入有效的 ETH 数量' : (e as Error).message || '无效输入')
    }
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
            <label className="block text-sm text-zinc-400">选择要拍卖的 NFT</label>
            {myNfts.length > 0 ? (
              <select
                value={tokenId}
                onChange={(e) => {
                  const v = e.target.value
                  setTokenId(v)
                  if (v && contractForList) setNftContract(contractForList)
                }}
                required
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
                required
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
              />
            )}
            {myNfts.length === 0 && address && (
              <p className="mt-1 text-xs text-zinc-500">当前钱包暂无 NFT，或列表加载中，可手动输入 Token ID</p>
            )}
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
            <label className="block text-sm text-zinc-400">最低出价 (ETH)</label>
            <input
              type="text"
              value={minBidEth}
              onChange={(e) => setMinBidEth(e.target.value)}
              placeholder="0.01"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <p className="text-sm text-zinc-500">支付方式：ETH</p>

          {(formError || txError) && (
            <p className="text-sm text-red-400">{formError ?? txError?.message}</p>
          )}

          {step === 'form' && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending || !tokenId || !minBidEth.trim()}
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
