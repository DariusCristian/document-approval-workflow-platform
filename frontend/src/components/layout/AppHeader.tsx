import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/useAuth'
import { cn } from '../../utils/cn'
import Avatar from '../ui/Avatar'
import Button from '../ui/Button'
import Logo from './Logo'

// "REVIEWER" -> "Reviewer".
function formatRole(role: string): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="rounded-md bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-ink-muted">
      {formatRole(role)}
    </span>
  )
}

function NavLinks({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const isCreatePage = pathname === '/documents/create'

  const links = [
    // "Documents" stays active on a document's detail page too.
    { to: '/documents', label: 'Documents', isActive: pathname.startsWith('/documents') && !isCreatePage },
    { to: '/documents/create', label: 'New document', isActive: isCreatePage },
  ]

  return (
    <nav aria-label="Main" className={cn('flex items-center gap-1', className)}>
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          aria-current={link.isActive ? 'page' : undefined}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            link.isActive
              ? 'bg-accent-soft text-accent'
              : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

function AppHeader() {
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4 sm:px-6">
        <Link
          to="/documents"
          className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Logo />
        </Link>

        {/* Laptop: links next to the logo. Phone: in a second row (below). */}
        <NavLinks className="hidden sm:flex" />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <div className="flex items-center gap-2.5">
              <Avatar name={currentUser.fullName} email={currentUser.email} />
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium text-ink">{currentUser.fullName}</p>
                <p className="text-xs text-ink-subtle">{formatRole(currentUser.role)}</p>
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            isLoading={isLoggingOut}
            aria-label="Log out"
            onClick={() => {
              void handleLogout()
            }}
          >
            {!isLoggingOut && (
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            )}
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>

      {/* Phone only: navigation, plus the role (the name is hidden there to save space). */}
      <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2 sm:hidden">
        <NavLinks className="-ml-3" />
        {currentUser && <RoleBadge role={currentUser.role} />}
      </div>
    </header>
  )
}

export default AppHeader
