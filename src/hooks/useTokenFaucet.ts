import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { tokenFaucetMintAbi } from '../contracts/abi'

/**
 * 调用代币合约的 mint() payable 充值（如 TST）
 * @param tokenAddress 代币合约地址
 * @param minEth 最小 ETH 金额，如 "0.001"
 */
export function useTokenFaucet(
  tokenAddress: `0x${string}` | undefined,
  minEth: string | undefined
) {
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const mint = () => {
    if (!tokenAddress || !minEth) return
    const value = parseEther(minEth)
    writeContract({
      address: tokenAddress,
      abi: tokenFaucetMintAbi,
      functionName: 'mint',
      value,
    })
  }

  return {
    mint,
    isPending: isPending || isConfirming,
    isSuccess,
    error: writeError,
  }
}
