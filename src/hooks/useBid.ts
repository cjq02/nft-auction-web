import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { auctionAbi, erc20Abi } from '../contracts/abi'
import { AUCTION_CONTRACT_ADDRESS } from '../contracts/addresses'

function resolveAuctionAddress(contractAddress: string | undefined): `0x${string}` {
  if (contractAddress && contractAddress.trim() !== '') {
    return contractAddress as `0x${string}`
  }
  return AUCTION_CONTRACT_ADDRESS
}

export function usePlaceBid(auctionId: string | undefined, contractAddress?: string) {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const address = resolveAuctionAddress(contractAddress)

  // 部分 RPC（如 Infura）单笔 tx gas 上限为 16,777,216，不设 gas 时 viem/钱包可能用 21e6 导致被拒
  const GAS_CAP = 16_000_000n

  const placeBidEth = (valueWei: bigint) => {
    if (!auctionId) return
    writeContract({
      address,
      abi: auctionAbi,
      functionName: 'placeBid',
      args: [BigInt(auctionId)],
      value: valueWei,
      gas: GAS_CAP,
    })
  }

  const placeBidToken = (amountWei: bigint, _tokenAddress: `0x${string}`) => {
    if (!auctionId) return
    writeContract({
      address,
      abi: auctionAbi,
      functionName: 'placeBidWithToken',
      args: [BigInt(auctionId), amountWei],
      gas: GAS_CAP,
    })
  }

  const approveToken = (tokenAddress: `0x${string}`, amountWei: bigint) => {
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [address, amountWei],
    })
  }

  if (isSuccess && hash) {
    queryClient.invalidateQueries({ queryKey: ['auction', auctionId] })
    queryClient.invalidateQueries({ queryKey: ['auctionBids', auctionId] })
  }

  return {
    placeBidEth,
    placeBidToken,
    approveToken,
    hash,
    error: writeError,
    isPending: isPending || isConfirming,
    isSuccess,
  }
}

export function useEndAuction(auctionId: string | undefined, contractAddress?: string) {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const address = resolveAuctionAddress(contractAddress)

  const endAuction = () => {
    if (!auctionId) return
    writeContract({
      address,
      abi: auctionAbi,
      functionName: 'endAuction',
      args: [BigInt(auctionId)],
      gas: 16_000_000n,
    })
  }

  if (isSuccess && hash) {
    queryClient.invalidateQueries({ queryKey: ['auction', auctionId] })
    queryClient.invalidateQueries({ queryKey: ['auctions'] })
  }

  return { endAuction, hash, error: writeError, isPending: isPending || isConfirming, isSuccess }
}

export function useCancelAuction(auctionId: string | undefined, contractAddress?: string) {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const address = resolveAuctionAddress(contractAddress)

  const cancelAuction = () => {
    if (!auctionId) return
    writeContract({
      address,
      abi: auctionAbi,
      functionName: 'cancelAuction',
      args: [BigInt(auctionId)],
      gas: 16_000_000n,
    })
  }

  if (isSuccess && hash) {
    queryClient.invalidateQueries({ queryKey: ['auction', auctionId] })
    queryClient.invalidateQueries({ queryKey: ['auctions'] })
  }

  return { cancelAuction, hash, error: writeError, isPending: isPending || isConfirming, isSuccess }
}
