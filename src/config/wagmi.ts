import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

const chainId = Number(import.meta.env.VITE_CHAIN_ID) || 11155111
const targetChain = chainId === 1 ? mainnet : sepolia

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

export { targetChain }
