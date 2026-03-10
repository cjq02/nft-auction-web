import { useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { erc20Abi } from '../contracts/abi'
import { AUCTION_CONTRACT_ADDRESS } from '../contracts/addresses'

/** 无限授权额度（type(uint256).max） */
export const MAX_APPROVAL = 2n ** 256n - 1n

export function useTokenApproval(tokenAddress: `0x${string}` | undefined, spender = AUCTION_CONTRACT_ADDRESS) {
  const { address } = useAccount()
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, spender] : undefined,
  })
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const isApproved = allowance != null && allowance >= MAX_APPROVAL

  const approve = () => {
    if (!tokenAddress) return
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, MAX_APPROVAL],
    })
  }

  /** 取消授权：将额度设为 0 */
  const revoke = () => {
    if (!tokenAddress) return
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, 0n],
    })
  }

  useEffect(() => {
    if (isSuccess) refetch()
  }, [isSuccess, refetch])

  return {
    approve,
    revoke,
    allowance,
    isApproved,
    isPending: isPending || isConfirming,
    isSuccess,
    error: writeError,
  }
}
