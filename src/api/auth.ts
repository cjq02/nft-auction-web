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

export interface AuthResponse {
  token: string
  user: { id: string; address: string; username?: string }
}

export function register(data: RegisterBody) {
  return api.post<AuthResponse>('/api/auth/register', data)
}

export function login(data: LoginBody) {
  return api.post<AuthResponse>('/api/auth/login', data)
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
