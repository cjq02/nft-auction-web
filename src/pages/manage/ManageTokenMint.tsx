import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { ADMIN_MINT_TOKENS } from '../../config/supportedTokens'
import { fetchUserList } from '../../api/auth'

const CUSTOM_ADDRESS_VALUE = '__custom__'

const erc20MintAbi = [
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/** 可铸造的代币：VITE_SUPPORTED_TOKENS 里 adminMint: true 的项 */
const mintableTokens = ADMIN_MINT_TOKENS.map((t) => ({
  address: t.address,
  symbol: t.symbol,
  decimals: t.decimals,
}))

export function ManageTokenMint() {
  const navigate = useNavigate()
  const [selectedTokenAddress, setSelectedTokenAddress] = useState(mintableTokens[0]?.address ?? '')
  const [selectedReceiver, setSelectedReceiver] = useState('')
  const [customAddress, setCustomAddress] = useState('')
  const [amount, setAmount] = useState('')
  const { data: userList = [] } = useQuery({ queryKey: ['userList'], queryFn: fetchUserList })

  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) navigate('/manage/accounts')
  }, [isSuccess, navigate])

  const resolvedAddress =
    selectedReceiver === CUSTOM_ADDRESS_VALUE ? customAddress.trim() : selectedReceiver
  const selectedToken = mintableTokens.find((t) => t.address === selectedTokenAddress) ?? mintableTokens[0]

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedToken || !resolvedAddress || !amount.trim()) return

    const value = parseUnits(amount.trim(), selectedToken.decimals)
    writeContract({
      address: selectedToken.address,
      abi: erc20MintAbi,
      functionName: 'mint',
      args: [resolvedAddress as `0x${string}`, value],
    })
  }

  const hasAdminToken = mintableTokens.length > 0

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <h2 className="mb-4 text-lg font-medium text-white">代币铸造（管理员）</h2>

      <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--bg)]/50 p-4 text-sm text-zinc-400">
        {!hasAdminToken ? (
          <p className="text-red-400">
            未配置可铸造代币。请在 .env 的 VITE_SUPPORTED_TOKENS 中为代币添加
            <code className="mx-1 rounded bg-zinc-700 px-1">"adminMint": true</code>
            （如 CNH）。
          </p>
        ) : (
          <>
            <p className="font-medium text-zinc-300">功能说明</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <strong className="text-zinc-300">仅合约 owner 可用</strong>：请使用代币合约
                owner 的钱包连接，否则交易会在链上失败。
              </li>
              <li>
                <strong className="text-zinc-300">接收地址</strong>：可从已注册用户中选择，或手动填写任意钱包地址。
              </li>
              <li>
                <strong className="text-zinc-300">铸造数量</strong>：以「整币」为单位填写，例如输入
                <code className="mx-1 rounded bg-zinc-700 px-1">100</code> 表示铸造 100 个代币（18
                位小数会自动换算）。
              </li>
            </ul>
          </>
        )}
      </div>

      <form onSubmit={handleMint} className="max-w-md space-y-4">
        {mintableTokens.length > 1 && (
          <div>
            <label className="block text-sm text-zinc-400">代币</label>
            <select
              value={selectedTokenAddress}
              onChange={(e) => setSelectedTokenAddress(e.target.value as `0x${string}`)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
            >
              {mintableTokens.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm text-zinc-400">接收地址</label>
          <select
            value={selectedReceiver}
            onChange={(e) => setSelectedReceiver(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="">请选择用户</option>
            {userList.map((u) => (
              <option key={u.walletAddress} value={u.walletAddress}>
                {u.username}
              </option>
            ))}
            <option value={CUSTOM_ADDRESS_VALUE}>自定义地址</option>
          </select>
          {selectedReceiver === CUSTOM_ADDRESS_VALUE && (
            <input
              type="text"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="0x1234...abcd（42 位以太坊地址）"
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
            />
          )}
        </div>

        <div>
          <label className="block text-sm text-zinc-400">
            铸造数量{selectedToken ? ` (${selectedToken.symbol})` : ''}
          </label>
          <input
            type="number"
            min="0"
            step="0.000000000000000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={selectedToken ? `例如：100（表示 100 ${selectedToken.symbol}）` : '例如：100'}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-white placeholder-zinc-500 focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        {writeError && <p className="text-sm text-red-400">{writeError.message}</p>}
        {isSuccess && <p className="text-sm text-[var(--accent)]">铸造成功</p>}

        <button
          type="submit"
          disabled={!hasAdminToken || isPending || !resolvedAddress || !amount.trim()}
          className="w-full rounded-lg bg-[var(--accent)] py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {isPending || isConfirming ? '请确认交易…' : '铸造代币'}
        </button>
      </form>
    </section>
  )
}

