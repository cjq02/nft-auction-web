import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { auctionAbi, erc721Abi } from '../contracts/abi'
import { AUCTION_CONTRACT_ADDRESS, NFT_CONTRACT_ADDRESS } from '../contracts/addresses'
import * as auctionApi from '../api/auction'
import type { ListParams } from '../api/auction'

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
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const create = async (params: {
    nftContract: `0x${string}`
    tokenId: bigint
    duration: bigint
    minBidUSD: bigint
    paymentToken: `0x${string}`
  }) => {
    writeContract({
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

  const approveNft = async (tokenId: bigint, nftContract: `0x${string}` = NFT_CONTRACT_ADDRESS) => {
    writeContract({
      address: nftContract,
      abi: erc721Abi,
      functionName: 'approve',
      args: [AUCTION_CONTRACT_ADDRESS, tokenId],
    })
  }

  if (isSuccess && hash) {
    queryClient.invalidateQueries({ queryKey: ['auctions'] })
  }

  return {
    create,
    approveNft,
    hash,
    error: writeError,
    isPending: isPending || isConfirming,
    isSuccess,
  }
}
