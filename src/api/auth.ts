import { api } from './client'

export interface RegisterBody {
  address: string
  username?: string
  email?: string
  password?: string
}

export interface LoginBody {
  address: string
  signature?: string
  message?: string
  password?: string
}

export interface UserInfo {
  id: number
  username: string
  walletAddress: string
  email?: string
}

export interface AuthResponse {
  token: string
  user: UserInfo
}

export function register(data: RegisterBody) {
  return api
    .post<{ code: number; data: AuthResponse }>('/api/auth/register', data)
    .then((res) => res.data)
}

export function login(data: LoginBody) {
  return api
    .post<{ code: number; data: AuthResponse }>('/api/auth/login', data)
    .then((res) => res.data)
}

/** 钱包连接后调用，传钱包地址获得 JWT（无需用户名密码） */
export function connectWallet(walletAddress: string) {
  return api
    .post<{ code: number; data: AuthResponse }>('/api/auth/wallet', { walletAddress })
    .then((res) => res.data)
}

export function setToken(token: string) {
  localStorage.setItem('nft_auction_token', token)
}

export function clearToken() {
  localStorage.removeItem('nft_auction_token')
}

export function getStoredToken(): string | null {
  return localStorage.getItem('nft_auction_token')
}
