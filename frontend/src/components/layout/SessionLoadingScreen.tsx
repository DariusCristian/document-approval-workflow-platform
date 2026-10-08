import Spinner from '../ui/Spinner'
import Logo from './Logo'

// Shown while the app asks the server who is logged in, before any page is chosen.
function SessionLoadingScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6">
      <Logo />
      <Spinner label="Checking your session" className="size-6 text-accent" />
    </div>
  )
}

export default SessionLoadingScreen
