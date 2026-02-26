import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as authApi from '../api/auth'
import { api } from '../api/client'

export interface User {
  id: string
  address: string
  username?: string
}

async function fetchMe(): Promise<User | null> {
  try {
    const data = await api.get<User>('/api/users/me')
    return data
  } catch {
    return null
  }
}

export function useAuth() {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', authApi.getStoredToken()],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res) => {
      authApi.setToken(res.token)
      queryClient.setQueryData(['user', res.token], res.user)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res) => {
      authApi.setToken(res.token)
      queryClient.setQueryData(['user', res.token], res.user)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })

  const logout = () => {
    authApi.clearToken()
    queryClient.setQueryData(['user', null], null)
    queryClient.invalidateQueries({ queryKey: ['user'] })
  }

  return {
    user: user ?? null,
    isLoggedIn: !!user,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  }
}
