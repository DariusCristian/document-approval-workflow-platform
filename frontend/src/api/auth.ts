import { fetchJson } from './client'

export interface LoginResponse {
  userId: number
  email: string
  role: string
  message: string
}

interface LoginRequest {
  email: string
  password: string
}

export function login(email: string, password: string): Promise<LoginResponse> {
  const payload: LoginRequest = { email, password }

  return fetchJson<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
  })
}
