import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import { api } from '../api/client'
import type { UserInfo, UpdateProfileBody } from '../api/auth'

async function fetchMe(): Promise<UserInfo | null> {
  if (!authApi.getStoredToken()) return null
  try {
    const res = await api.get<{ code: number; data: UserInfo }>('/api/users/me')
    return res.data ?? null
  } catch {
    return null
  }
}

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
  })

  const saveAndRefresh = (res: authApi.AuthResponse) => {
    authApi.setToken(res.token)
    queryClient.setQueryData(['user'], res.user)
  }

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: saveAndRefresh,
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: saveAndRefresh,
  })

  const connectWalletMutation = useMutation({
    mutationFn: (walletAddress: string) => authApi.connectWallet(walletAddress),
    onSuccess: saveAndRefresh,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (body: UpdateProfileBody) => authApi.updateProfile(body),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user'], updatedUser)
    },
  })

  const logout = () => {
    authApi.clearToken()
    queryClient.setQueryData(['user'], null)
    queryClient.invalidateQueries({ queryKey: ['user'] })
  }

  const currentUser = user ?? null
  // 新用户：username 与 walletAddress 相同（ConnectOrCreateByWallet 的默认值）
  const isNewUser =
    !!currentUser &&
    currentUser.username?.toLowerCase() === currentUser.walletAddress?.toLowerCase()

  return {
    user: currentUser,
    isLoggedIn: !!currentUser,
    isNewUser,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    connectWallet: connectWalletMutation.mutateAsync,
    connectWalletPending: connectWalletMutation.isPending,
    connectWalletError: connectWalletMutation.error,
    updateProfile: updateProfileMutation.mutateAsync,
    updateProfilePending: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  }
}
