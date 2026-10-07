import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getCurrentUser, logout as logoutRequest } from '../api/auth'
import { setUnauthorizedHandler } from '../api/client'

// Older versions kept the user here; it is no longer read, only cleaned up.
const LEGACY_STORAGE_KEY = 'docflow_current_user'

const SESSION_EXPIRED_MESSAGE = 'Your session expired, please log in again.'

export interface CurrentUser {
  id: number
  email: string
  fullName: string
  role: string
}

interface AuthContextValue {
  currentUser: CurrentUser | null
  // True until the first /api/auth/me check has finished.
  isCheckingSession: boolean
  // A message for the login page, e.g. after the session expired.
  loginNotice: string
  // Asks the server who is logged in (call right after a successful login).
  refreshCurrentUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [loginNotice, setLoginNotice] = useState('')

  // On app load, the session cookie (not the browser's storage) decides who is logged in.
  useEffect(() => {
    let isCancelled = false
    localStorage.removeItem(LEGACY_STORAGE_KEY)

    getCurrentUser()
      .then((user) => {
        if (!isCancelled) {
          setCurrentUser(user)
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setCurrentUser(null)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsCheckingSession(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  // Any 401 from the API means the session is gone: forget the user, so routes redirect to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setCurrentUser(null)
      setLoginNotice(SESSION_EXPIRED_MESSAGE)
    })

    return () => setUnauthorizedHandler(null)
  }, [])

  const refreshCurrentUser = useCallback(async () => {
    const user = await getCurrentUser()
    setCurrentUser(user)
    setLoginNotice('')
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Even if the server call fails (e.g. session already expired), log out locally.
    }
    setCurrentUser(null)
    setLoginNotice('')
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isCheckingSession,
      loginNotice,
      refreshCurrentUser,
      logout,
    }),
    [currentUser, isCheckingSession, loginNotice, refreshCurrentUser, logout],
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
