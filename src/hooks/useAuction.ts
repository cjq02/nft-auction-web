import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { auctionAbi, erc721Abi } from '../contracts/abi'
import { AUCTION_CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS } from '../contracts/addresses'
import * as auctionApi from '../api/auction'
import type { ListParams } from '../api/auction'

// How long to wait after tx confirmation before refreshing the auction list.
// The backend event listener (WebSocket) typically indexes within 1-2 seconds
// of the block being mined; 5s gives a comfortable buffer.
const INDEXER_SETTLE_MS = 5_000

export function useAuctionList(params?: ListParams) {
  return useQuery({
    queryKey: ['auctions', params],
    queryFn: () => auctionApi.fetchAuctionList(params),
  })
}

export function useAuction(id: string | undefined) {
  return useQuery({
    queryKey: ['auction', id],
    queryFn: () => auctionApi.fetchAuctionById(id!),
    enabled: !!id,
  })
}

export function useAuctionBids(auctionId: string | undefined) {
  return useQuery({
    queryKey: ['auctionBids', auctionId],
    queryFn: () => auctionApi.fetchAuctionBids(auctionId!),
    enabled: !!auctionId,
  })
}

export function useUserAuctions() {
  const { address } = useAccount()
  return useQuery({
    queryKey: ['userAuctions', address],
    queryFn: () => auctionApi.fetchUserAuctions(address!),
    enabled: !!address,
  })
}

export function useCreateAuction() {
  const queryClient = useQueryClient()

  // approve 和 create 使用独立的 writeContract，各自有独立的 isPending / isSuccess
  const {
    writeContract: writeApprove,
    data: approveHash,
    error: approveError,
    isPending: isApproveWritePending,
  } = useWriteContract()

  const {
    writeContract: writeCreate,
    data: createHash,
    error: createError,
    isPending: isCreateWritePending,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash })

  const { isLoading: isCreateConfirming, isSuccess: isCreateSuccess } =
    useWaitForTransactionReceipt({ hash: createHash })

  // 交易确认后，等待后端事件监听器索引完成，再刷新列表
  useEffect(() => {
    if (!isCreateSuccess || !createHash) return

    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['auctions'] })
    }, INDEXER_SETTLE_MS)

    return () => clearTimeout(timer)
  }, [isCreateSuccess, createHash, queryClient])

  const approveNft = (tokenId: bigint, nftContract: `0x${string}` = NFT_CONTRACT_ADDRESS) => {
    writeApprove({
      address: nftContract,
      abi: erc721Abi,
      functionName: 'approve',
      args: [AUCTION_CONTRACT_ADDRESS, tokenId],
    })
  }

  const create = (params: {
    nftContract: `0x${string}`
    tokenId: bigint
    duration: bigint
    minBidUSD: bigint
    paymentToken: `0x${string}`
  }) => {
    writeCreate({
      address: AUCTION_CONTRACT_ADDRESS,
      abi: auctionAbi,
      functionName: 'createAuction',
      args: [
        params.nftContract,
        params.tokenId,
        params.duration,
        params.minBidUSD,
        params.paymentToken,
      ],
    })
  }

  return {
    approveNft,
    create,
    approveError,
    createError,
    isApprovePending: isApproveWritePending || isApproveConfirming,
    isApproveSuccess,
    isCreatePending: isCreateWritePending || isCreateConfirming,
    isCreateSuccess,
  }
}
