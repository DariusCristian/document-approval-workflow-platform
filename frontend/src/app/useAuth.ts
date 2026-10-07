import { createContext, useContext } from 'react'

export interface CurrentUser {
  id: number
  email: string
  fullName: string
  role: string
}

export interface AuthContextValue {
  currentUser: CurrentUser | null
  // True until the first /api/auth/me check has finished.
  isCheckingSession: boolean
  // A message for the login page, e.g. after the session expired.
  loginNotice: string
  // Asks the server who is logged in (call right after a successful login).
  refreshCurrentUser: () => Promise<void>
  logout: () => Promise<void>
}

// Kept apart from AuthProvider so AuthContext.tsx only exports a component (needed for fast refresh).
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
