import { useReadContract } from 'wagmi'
import { AUCTION_CONTRACT_ADDRESS } from '../contracts/addresses'
import { auctionAbi, chainlinkAggregatorAbi } from '../contracts/abi'

const ZERO = '0x0000000000000000000000000000000000000000'

/**
 * 读取链上 ETH/USD 价格（8 位小数）
 * 通过拍卖合约的 ethPriceFeed 获取 Chainlink 预言机价格
 */
export function useEthPrice() {
  const isContractSet = AUCTION_CONTRACT_ADDRESS?.toLowerCase() !== ZERO.toLowerCase()
  const { data: feedAddress } = useReadContract({
    address: isContractSet ? AUCTION_CONTRACT_ADDRESS : undefined,
    abi: auctionAbi,
    functionName: 'ethPriceFeed',
  })
  const hasFeed = feedAddress && feedAddress !== ZERO
  const { data: roundData } = useReadContract({
    address: hasFeed ? (feedAddress as `0x${string}`) : undefined,
    abi: chainlinkAggregatorAbi,
    functionName: 'latestRoundData',
  })
  const ethPrice8 = roundData?.[1] != null ? BigInt(roundData[1]) : undefined
  return { ethPrice8 }
}
