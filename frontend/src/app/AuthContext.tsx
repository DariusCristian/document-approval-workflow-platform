import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

const AUTH_STORAGE_KEY = 'docflow_current_user'

export interface CurrentUser {
  userId: number
  email: string
  role: string
}

interface AuthContextValue {
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser) => void
  clearCurrentUser: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function readStoredUser(): CurrentUser | null {
  const rawValue = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as CurrentUser
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUserState, setCurrentUserState] = useState<CurrentUser | null>(
    () => readStoredUser(),
  )

  const setCurrentUser = (user: CurrentUser) => {
    setCurrentUserState(user)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  }

  const clearCurrentUser = () => {
    setCurrentUserState(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: currentUserState,
      setCurrentUser,
      clearCurrentUser,
    }),
    [currentUserState],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
