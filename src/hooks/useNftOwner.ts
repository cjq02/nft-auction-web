import { useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { nftMarketplaceAbi } from '../contracts/abi'
import { NFT_CONTRACT_ADDRESS } from '../contracts/addresses'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function useNftOwner() {
  const { address } = useAccount()
  const isContractSet = NFT_CONTRACT_ADDRESS !== ZERO_ADDRESS
  const { data: owner, isLoading, isError, error } = useReadContract({
    address: isContractSet ? NFT_CONTRACT_ADDRESS : undefined,
    abi: nftMarketplaceAbi,
    functionName: 'owner',
  })

  const isOwner =
    !!address &&
    !!owner &&
    address.toLowerCase() === (owner as string).toLowerCase()

  useEffect(() => {
    console.log('[useNftOwner]', {
      NFT_CONTRACT_ADDRESS,
      address,
      owner,
      isLoading,
      isError,
      error: error?.message,
      isOwner,
    })
  }, [address, owner, isLoading, isError, error, isOwner])

  return { isOwner, owner: owner as string | undefined, isLoading }
}
