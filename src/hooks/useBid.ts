import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { auctionAbi, erc20Abi } from '../contracts/abi'
import { AUCTION_CONTRACT_ADDRESS } from '../contracts/addresses'

export function usePlaceBid(auctionId: string | undefined) {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const placeBidEth = (valueWei: bigint) => {
    if (!auctionId) return
    writeContract({
      address: AUCTION_CONTRACT_ADDRESS,
      abi: auctionAbi,
      functionName: 'placeBid',
      args: [BigInt(auctionId)],
      value: valueWei,
    })
  }

  const placeBidToken = (amountWei: bigint, _tokenAddress: `0x${string}`) => {
    if (!auctionId) return
    writeContract({
      address: AUCTION_CONTRACT_ADDRESS,
      abi: auctionAbi,
      functionName: 'placeBidWithToken',
      args: [BigInt(auctionId), amountWei],
    })
  }

  const approveToken = (tokenAddress: `0x${string}`, amountWei: bigint) => {
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [AUCTION_CONTRACT_ADDRESS, amountWei],
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

export function useEndAuction(auctionId: string | undefined) {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const endAuction = () => {
    if (!auctionId) return
    writeContract({
      address: AUCTION_CONTRACT_ADDRESS,
      abi: auctionAbi,
      functionName: 'endAuction',
      args: [BigInt(auctionId)],
    })
  }

  if (isSuccess && hash) {
    queryClient.invalidateQueries({ queryKey: ['auction', auctionId] })
    queryClient.invalidateQueries({ queryKey: ['auctions'] })
  }

  return { endAuction, hash, error: writeError, isPending: isPending || isConfirming, isSuccess }
}

export function useCancelAuction(auctionId: string | undefined) {
  const queryClient = useQueryClient()
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const cancelAuction = () => {
    if (!auctionId) return
    writeContract({
      address: AUCTION_CONTRACT_ADDRESS,
      abi: auctionAbi,
      functionName: 'cancelAuction',
      args: [BigInt(auctionId)],
    })
  }

  if (isSuccess && hash) {
    queryClient.invalidateQueries({ queryKey: ['auction', auctionId] })
    queryClient.invalidateQueries({ queryKey: ['auctions'] })
  }

  return { cancelAuction, hash, error: writeError, isPending: isPending || isConfirming, isSuccess }
}
