import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../app/useAuth'
import DemoAccounts from '../components/auth/DemoAccounts'
import Logo from '../components/layout/Logo'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { inputClasses, labelClasses } from '../components/ui/formStyles'

function LoginPage() {
  const navigate = useNavigate()
  const { refreshCurrentUser, loginNotice } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      await login(email, password)
      // Load the user from the new session, so the app only trusts what the server says.
      await refreshCurrentUser()
      setSuccessMessage('Login successful. Redirecting to documents...')
      navigate('/documents')
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Login failed. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoAccountSelect = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setErrorMessage('')
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <p className="mt-3 text-sm text-ink-subtle">Write, review and approve documents.</p>
        </div>

        <Card>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-ink-subtle">Use your DocFlow account to continue.</p>

          <div className="mt-6 space-y-3 empty:hidden">
            {loginNotice && <Alert variant="warning">{loginNotice}</Alert>}
            {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
            {successMessage && <Alert variant="success">{successMessage}</Alert>}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className={labelClasses}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className={inputClasses()}
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClasses}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className={inputClasses()}
              />
            </div>

            <Button type="submit" isLoading={isSubmitting} className="w-full">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Card>

        {import.meta.env.DEV && (
          <DemoAccounts onSelect={handleDemoAccountSelect} disabled={isSubmitting} />
        )}
      </div>
    </main>
  )
}

export default LoginPage
