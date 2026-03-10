import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAccount, useBalance, useReadContract } from 'wagmi'
import { parseEther, formatEther, formatUnits, parseUnits } from 'viem'
import { useAuction, useAuctionBids } from '../hooks/useAuction'
import { usePlaceBid, useEndAuction, useCancelAuction } from '../hooks/useBid'
import { useToast } from '../hooks/use-toast'
import { getContractRevertMessage, getShortRevertReason } from '../utils/contractError'
import { toDisplayImageUrl } from '../utils/ipfs'
import { minBidDisplayFromApi, minBidInTokenDisplay } from '../utils/auctionDisplay'
import { isEthPayment, getTokenByAddress } from '../config/supportedTokens'
import { useTokenApproval } from '../hooks/useTokenApproval'
import { useTokenPrice } from '../hooks/useTokenPrice'
import { AUCTION_CONTRACT_ADDRESS } from '../contracts/addresses'
import { erc20Abi } from '../contracts/abi'

function formatAddress(addr: string | null | undefined) {
  if (!addr) return '-'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

/** 后端时间戳为 Unix 秒，需 ×1000 转为毫秒 */
function formatTime(ts: number | string | null | undefined) {
  if (!ts) return '-'
  const ms = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
  if (isNaN(ms)) return '-'
  return new Date(ms).toLocaleString('zh-CN')
}

/** 根据 isETH 格式化出价金额 */
function formatBidAmount(amount: string | null | undefined, isEth: boolean, tokenSymbol?: string) {
  if (!amount) return '-'
  try {
    const wei = BigInt(amount)
    if (isEth) return `${formatEther(wei)} ETH`
    return `${formatUnits(wei, 18)} ${tokenSymbol ?? 'TOKEN'}`
  } catch {
    return amount
  }
}

export function AuctionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { address } = useAccount()
  const { toast } = useToast()
  const [bidAmount, setBidAmount] = useState('')

  const { data: auction, isLoading, error } = useAuction(id)
  const { data: bids = [] } = useAuctionBids(id)
  const {
    placeBidEth,
    placeBidToken,
    error: bidError,
    isPending: bidPending,
    isSuccess: bidSuccess,
  } = usePlaceBid(id, auction?.auctionContract)
  const { endAuction, error: endError, isPending: endPending, isSuccess: endSuccess } = useEndAuction(id, auction?.auctionContract)
  const { cancelAuction, error: cancelError, isPending: cancelPending } = useCancelAuction(id, auction?.auctionContract)

  const isSeller = address && auction?.seller?.toLowerCase() === address.toLowerCase()
  const statusLower = auction?.status?.toLowerCase()
  const isActive = statusLower === 'active'
  const ended = statusLower === 'ended'
  const canEnd = isActive && auction?.endTime && auction.endTime * 1000 <= Date.now()
  const hasBids = (bids?.length ?? 0) > 0
  const isEthAuction = isEthPayment(auction?.paymentToken)
  const paymentToken = getTokenByAddress(auction?.paymentToken ?? null)
  const auctionContract = (auction?.auctionContract || AUCTION_CONTRACT_ADDRESS) as `0x${string}`
  const { tokenPrice8 } = useTokenPrice(
    !isEthAuction && auction?.paymentToken ? (auction.paymentToken as `0x${string}`) : undefined
  )
  const { approve: approveTokenUnlimited, isApproved: isTokenApproved } = useTokenApproval(
    !isEthAuction && auction?.paymentToken ? (auction.paymentToken as `0x${string}`) : undefined,
    auctionContract
  )

  const { data: ethBalance } = useBalance({ address: address ?? undefined })
  const { data: tokenBalance } = useReadContract({
    address: !isEthAuction && auction?.paymentToken ? (auction.paymentToken as `0x${string}`) : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  const insufficientBalance = (() => {
    if (!bidAmount.trim()) return false
    try {
      if (isEthAuction) {
        const need = parseEther(bidAmount)
        return ethBalance?.value != null && ethBalance.value < need
      }
      if (auction?.paymentToken && paymentToken) {
        const need = parseUnits(bidAmount, paymentToken.decimals)
        return tokenBalance != null && BigInt(tokenBalance) < need
      }
    } catch {
      /* 输入非有效数字时不判定为余额不足 */
    }
    return false
  })()

  const handleBid = () => {
    if (isEthAuction) {
      const wei = parseEther(bidAmount)
      placeBidEth(wei)
    } else if (auction?.paymentToken) {
      const decimals = paymentToken?.decimals ?? 18
      const amountWei = parseUnits(bidAmount, decimals)
      placeBidToken(amountWei, auction.paymentToken as `0x${string}`)
    }
  }

  const handleApproveToken = () => {
    approveTokenUnlimited()
  }

  useEffect(() => {
    if (bidSuccess) {
      setBidAmount('')
      const t = setTimeout(() => navigate(0), 500)
      return () => clearTimeout(t)
    }
  }, [bidSuccess, navigate])

  useEffect(() => {
    if (bidError) {
      toast({
        variant: 'destructive',
        title: '出价失败',
        description: getShortRevertReason(bidError),
      })
    }
  }, [bidError, toast])

  if (endSuccess) {
    setTimeout(() => navigate(0), 500)
  }

  if (isLoading || !id) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="h-96 animate-pulse rounded-xl bg-[var(--card)]" />
      </div>
    )
  }

  if (error || !auction) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center text-red-400">
        加载失败或拍卖不存在
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="aspect-square bg-zinc-800">
            {auction.nft?.image ? (
              <img
                src={toDisplayImageUrl(auction.nft.image) ?? auction.nft.image}
                alt={auction.nft.name ?? 'NFT'}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl text-zinc-600">
                #{auction.tokenId}
              </div>
            )}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {auction.nft?.name ?? `Token #${auction.tokenId}`}
          </h1>
          <p className="mt-2 text-zinc-400">{auction.nft?.description}</p>
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">拍卖 ID</dt>
              <dd className="text-white">{auction.auctionId ?? auction.id ?? '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">卖家</dt>
              <dd className="text-white" title={auction.seller}>
                {auction.sellerName ?? formatAddress(auction.seller)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">开始时间</dt>
              <dd className="text-white">{formatTime(auction.startTime)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">结束时间</dt>
              <dd className="text-white">{formatTime(auction.endTime)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 text-zinc-500">最低出价</dt>
              <dd className="min-w-0 shrink-0 text-right text-white">
                {(() => {
                  const { usd, eth } = minBidDisplayFromApi(auction.minBid, auction.minBidEth)
                  const tokenAmount = minBidInTokenDisplay(auction.minBid, tokenPrice8)
                  return (
                    <span className="block">
                      {isEthAuction ? (
                        <>
                          <span className="block">{usd}</span>
                          {eth !== '—' && <span className="block text-white">{eth}</span>}
                        </>
                      ) : (
                        <>
                          <span className="block">
                            {tokenAmount !== '—' ? `${tokenAmount} ${paymentToken?.symbol ?? '代币'}` : `以 ${paymentToken?.symbol ?? '代币'} 出价`}
                          </span>
                          <span className="block text-zinc-400">{usd}</span>
                        </>
                      )}
                    </span>
                  )
                })()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">支付方式</dt>
              <dd className="text-white">
                {isEthAuction ? 'ETH' : paymentToken?.symbol ?? formatAddress(auction.paymentToken)}
              </dd>
            </div>
          </dl>

          {isActive && !isSeller && (
            <div className="mt-6 rounded-lg border border-[var(--border)] bg-zinc-900/50 p-4">
              <label className="block text-sm text-zinc-400">
                出价 ({isEthAuction ? 'ETH' : paymentToken?.symbol ?? '代币'})
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  type="text"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 min-w-[120px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
                />
                {!isEthAuction && auction?.paymentToken && !isTokenApproved && (
                  <button
                    type="button"
                    onClick={handleApproveToken}
                    disabled={bidPending}
                    className="rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 disabled:opacity-50"
                  >
                    授权
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleBid}
                  disabled={bidPending || !bidAmount || insufficientBalance}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {bidPending ? '提交中...' : '出价'}
                </button>
              </div>
              {insufficientBalance && (
                <p className="mt-2 text-sm text-amber-500">余额不足</p>
              )}
              {!isEthAuction && !isTokenApproved && (
                <p className="mt-2 text-xs text-zinc-500">
                  首次出价需先授权，也可在
                  <Link to="/profile" className="mx-1 text-[var(--accent)] hover:underline">个人中心</Link>
                  统一授权
                </p>
              )}
              {bidError && (
                <p className="mt-2 text-sm text-red-400">
                  {getShortRevertReason(bidError)}
                </p>
              )}
            </div>
          )}

          {isSeller && isActive && !hasBids && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => cancelAuction()}
                disabled={cancelPending}
                className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
              >
                {cancelPending ? '取消中...' : '取消拍卖'}
              </button>
              {cancelError && (
                <p className="mt-2 text-sm text-red-400">
                  {getContractRevertMessage(cancelError)}
                </p>
              )}
            </div>
          )}

          {canEnd && isSeller && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => endAuction()}
                disabled={endPending}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {endPending ? '处理中...' : '结束拍卖'}
              </button>
              {endError && (
                <p className="mt-2 text-sm text-red-400">
                  {getContractRevertMessage(endError)}
                </p>
              )}
            </div>
          )}

          {ended && (
            <p className="mt-6 text-zinc-400">拍卖已结束</p>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">出价记录</h2>
        {!bids?.length ? (
          <p className="text-zinc-500">暂无出价</p>
        ) : (
          <ul className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            {bids.map((bid, i) => (
              <li
                key={i}
                className="flex justify-between text-sm"
              >
                <span className="text-zinc-300" title={bid.bidder}>
                  {bid.bidderName ?? formatAddress(bid.bidder)}
                </span>
                <span className="text-[var(--accent)]">
                  {formatBidAmount(bid.amount, bid.isETH ?? bid.isEth ?? false, paymentToken?.symbol)}
                </span>
                <span className="text-zinc-500">{formatTime(bid.timestamp)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
