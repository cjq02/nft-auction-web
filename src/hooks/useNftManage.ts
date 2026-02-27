import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { nftMarketplaceAbi } from '../contracts/abi'
import { NFT_CONTRACT_ADDRESS } from '../contracts/addresses'

export function useNftMint() {
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const mint = (to: `0x${string}`, tokenURI: string) => {
    writeContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: nftMarketplaceAbi,
      functionName: 'mint',
      args: [to, tokenURI],
    })
  }

  return {
    mint,
    hash,
    error: writeError,
    isPending: isPending || isConfirming,
    isSuccess,
  }
}

export function useNftBurn() {
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const burn = (tokenId: bigint) => {
    writeContract({
      address: NFT_CONTRACT_ADDRESS,
      abi: nftMarketplaceAbi,
      functionName: 'burn',
      args: [tokenId],
    })
  }

  return {
    burn,
    hash,
    error: writeError,
    isPending: isPending || isConfirming,
    isSuccess,
  }
}
