import { fetchJson } from './client'

export interface LoginResponse {
  userId: number
  email: string
  role: string
  message: string
}

export interface CurrentUserResponse {
  id: number
  email: string
  fullName: string
  role: string
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
    // A 401 here means a wrong password, not an expired session.
    skipUnauthorizedHandler: true,
  })
}

export function getCurrentUser(): Promise<CurrentUserResponse> {
  return fetchJson<CurrentUserResponse>('/api/auth/me', {
    skipUnauthorizedHandler: true,
  })
}

export function logout(): Promise<void> {
  return fetchJson<void>('/api/auth/logout', {
    method: 'POST',
    skipUnauthorizedHandler: true,
  })
}
