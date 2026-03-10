import { useAccount, useReadContract } from 'wagmi'
import { auctionAbi } from '../contracts/abi'
import { AUCTION_CONTRACT_ADDRESS } from '../contracts/addresses'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function useAuctionOwner() {
  const { address } = useAccount()
  const isContractSet = AUCTION_CONTRACT_ADDRESS !== ZERO_ADDRESS
  const { data: owner, isLoading } = useReadContract({
    address: isContractSet ? AUCTION_CONTRACT_ADDRESS : undefined,
    abi: auctionAbi,
    functionName: 'owner',
  })

  const isOwner =
    !!address &&
    !!owner &&
    address.toLowerCase() === (owner as string).toLowerCase()

  return { isOwner, owner: owner as string | undefined, isLoading }
}
