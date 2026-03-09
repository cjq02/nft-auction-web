import { BaseError, ContractFunctionRevertedError } from 'viem'

/**
 * 从合约/wallet 错误中提取可展示给用户的失败原因。
 * - 合约 require/revert 会解析为 ContractFunctionRevertedError，取出 Error(string) 的文案或 custom error 信息
 * - 用户拒绝等则返回原始 message
 */
export function getContractRevertMessage(error: unknown): string {
  if (error == null) return ''

  const err = error as Error & { walk?: (fn: (e: unknown) => boolean) => unknown }
  if (typeof err.message !== 'string') return String(error)

  // viem: 在 cause 链里找 ContractFunctionRevertedError
  if (err instanceof BaseError) {
    const revertErr = err.walk?.((e) => e instanceof ContractFunctionRevertedError) as
      | ContractFunctionRevertedError
      | undefined
    if (revertErr instanceof ContractFunctionRevertedError && revertErr.data) {
      const { errorName, args } = revertErr.data
      // require("xxx") 编译为 Error(string)，args[0] 即原因
      if (errorName === 'Error' && args?.[0] != null) return String(args[0])
      if (args?.length) return `${errorName}: ${args.map(String).join(', ')}`
      return errorName ?? revertErr.shortMessage ?? err.message
    }
  }

  // 常见钱包/链错误文案简化
  const msg = err.message
  if (/user rejected|用户拒绝|user denied/i.test(msg)) return '已取消'
  if (/insufficient funds/i.test(msg)) return '余额不足'
  if (/gas|execution reverted/i.test(msg)) return msg

  return msg
}

/** 从长错误文案中只保留简短 revert 原因，去掉 Raw Call、地址、gas 等调试信息；用于 toast 等友好展示 */
export function getShortRevertReason(error: unknown): string {
  const raw = getContractRevertMessage(error) || (error && typeof (error as Error).message === 'string' ? (error as Error).message : String(error ?? ''))
  if (!raw || raw.length < 100) return raw.trim() || 'Transaction failed.'

  // 优先取 "reason: ..." 或 "reverted: ..." 后的一句（到句号或行末）
  const reasonMatch = raw.match(/(?:reverted with reason|execution reverted):\s*([^.]+\.?)\s*/i)
  if (reasonMatch) return reasonMatch[1].trim() || raw

  // 否则截断：去掉 "Raw Call Arguments" 及之后的内容
  const beforeRaw = raw.split(/\s*Raw Call Arguments\s*/i)[0].trim()
  if (beforeRaw.length > 0 && beforeRaw.length < raw.length) return beforeRaw.length > 120 ? beforeRaw.slice(0, 120) + '…' : beforeRaw

  // 或去掉 "Details:" 及之后
  const beforeDetails = raw.split(/\s*Details:\s*/i)[0].trim()
  if (beforeDetails.length > 0 && beforeDetails.length < raw.length) return beforeDetails.length > 120 ? beforeDetails.slice(0, 120) + '…' : beforeDetails

  return raw.length > 120 ? raw.slice(0, 120) + '…' : raw
}
