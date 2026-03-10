import { useQuery } from '@tanstack/react-query'
import { useBalance, useReadContract } from 'wagmi'
import { formatEther, formatUnits } from 'viem'
import { fetchUserList } from '../../api/auth'
import { SUPPORTED_TOKENS } from '../../config/supportedTokens'
import { NFT_CONTRACT_ADDRESS } from '../../contracts/addresses'
import { erc20Abi, erc721Abi } from '../../contracts/abi'

const ZERO = '0x0000000000000000000000000000000000000000'

function EthCell({ address }: { address: `0x${string}` }) {
  const { data } = useBalance({ address })
  if (data?.value == null) return <span className="text-zinc-500">—</span>
  const ethNum = Number(formatEther(data.value))
  return <span>{ethNum.toFixed(3)} ETH</span>
}

function TokenCell({ token, address }: { token: { address: `0x${string}`; symbol: string; decimals: number }; address: `0x${string}` }) {
  const { data } = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  })
  if (data == null) return <span className="text-zinc-500">—</span>
  return <span>{formatUnits(data, token.decimals)} {token.symbol}</span>
}

function NftCountCell({ address }: { address: `0x${string}` }) {
  const hasNftContract = NFT_CONTRACT_ADDRESS && NFT_CONTRACT_ADDRESS !== ZERO
  const { data } = useReadContract({
    address: hasNftContract ? NFT_CONTRACT_ADDRESS : undefined,
    abi: erc721Abi,
    functionName: 'balanceOf',
    args: [address],
  })
  if (!hasNftContract) return <span className="text-zinc-500">—</span>
  if (data == null) return <span className="text-zinc-500">—</span>
  return <span>{String(data)}</span>
}

function AccountRow({ user }: { user: { username: string; walletAddress: string } }) {
  const addr = user.walletAddress as `0x${string}`
  const shortAddr = `${addr.slice(0, 6)}…${addr.slice(-4)}`
  return (
    <tr className="border-b border-[var(--border)]">
      <td className="py-3 pr-4 text-white">{user.username || '—'}</td>
      <td className="py-3 pr-4 font-mono text-sm text-zinc-400" title={addr}>
        {shortAddr}
      </td>
      <td className="py-3 pr-4 text-sm">
        <EthCell address={addr} />
      </td>
      {SUPPORTED_TOKENS.map((t) => (
        <td key={t.address} className="py-3 pr-4 text-sm">
          <TokenCell token={t} address={addr} />
        </td>
      ))}
      <td className="py-3 text-sm">
        <NftCountCell address={addr} />
      </td>
    </tr>
  )
}

export function ManageAccountList() {
  const { data: userList = [], isLoading } = useQuery({ queryKey: ['userList'], queryFn: fetchUserList })

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-medium text-white">账户列表</h2>
      <p className="mb-4 text-sm text-zinc-500">
        展示已注册用户的链上资产：ETH 余额、支持的 ERC20 代币数量、持有的 NFT 数量。
      </p>
      {isLoading ? (
        <div className="py-8 text-center text-zinc-500">加载中…</div>
      ) : !userList.length ? (
        <div className="py-8 text-center text-zinc-500">暂无用户</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-zinc-400">
                <th className="pb-3 pr-4 font-medium">用户名</th>
                <th className="pb-3 pr-4 font-medium">地址</th>
                <th className="pb-3 pr-4 font-medium">ETH</th>
                {SUPPORTED_TOKENS.map((t) => (
                  <th key={t.address} className="pb-3 pr-4 font-medium">
                    {t.symbol}
                  </th>
                ))}
                <th className="pb-3 font-medium">NFT 数量</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((u) => (
                <AccountRow key={u.walletAddress} user={u} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
