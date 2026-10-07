import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getCurrentUser, logout as logoutRequest } from '../api/auth'
import { setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './useAuth'
import type { AuthContextValue, CurrentUser } from './useAuth'

// Older versions kept the user here; it is no longer read, only cleaned up.
const LEGACY_STORAGE_KEY = 'docflow_current_user'

const SESSION_EXPIRED_MESSAGE = 'Your session expired, please log in again.'

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
