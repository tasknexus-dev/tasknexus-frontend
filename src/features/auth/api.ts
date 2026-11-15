import { http } from '@/shared/api/http'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  createdAt: string
}

/** El refresh token no llega aquí: el backend lo deja en una cookie httpOnly. */
export interface AuthResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: User
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/v1/auth/register', input)
  return data
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/v1/auth/login', input)
  return data
}

export async function refresh(): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/api/v1/auth/refresh')
  return data
}

export async function logout(): Promise<void> {
  await http.post('/api/v1/auth/logout')
}

export async function fetchMe(): Promise<User> {
  const { data } = await http.get<User>('/api/v1/users/me')
  return data
}
