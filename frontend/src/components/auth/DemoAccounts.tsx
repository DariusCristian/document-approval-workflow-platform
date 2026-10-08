// The accounts created by the backend's DevDataSeeder (dev profile only).
// Only rendered when import.meta.env.DEV is true, so it never reaches a production build.
const DEMO_PASSWORD = 'password123'

const demoAccounts = [
  { name: 'Alice Admin', role: 'Admin', email: 'admin@docflow.local' },
  { name: 'Rita Reviewer', role: 'Reviewer', email: 'reviewer@docflow.local' },
  { name: 'Adam Author', role: 'Author', email: 'author1@docflow.local' },
  { name: 'Bella Author', role: 'Author', email: 'author2@docflow.local' },
]

interface DemoAccountsProps {
  // Fills the login form; the user still clicks "Sign in" themselves.
  onSelect: (email: string, password: string) => void
  disabled?: boolean
}

function DemoAccounts({ onSelect, disabled = false }: DemoAccountsProps) {
  return (
    <section
      aria-labelledby="demo-accounts-title"
      className="mt-6 rounded-xl border border-dashed border-line bg-surface/60 p-4"
    >
      <div className="flex items-baseline justify-between gap-2 px-2">
        <h2 id="demo-accounts-title" className="text-sm font-semibold text-ink">
          Demo accounts
        </h2>
        <span className="text-xs text-ink-subtle">
          Password: <code className="font-mono text-ink-muted">{DEMO_PASSWORD}</code>
        </span>
      </div>
      <p className="mt-1 px-2 text-xs text-ink-subtle">Development only. Click one to fill in the form.</p>

      <ul className="mt-3 divide-y divide-line">
        {demoAccounts.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(account.email, DEMO_PASSWORD)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">{account.name}</span>
                <span className="block truncate text-xs text-ink-subtle">{account.email}</span>
              </span>
              <span className="shrink-0 rounded-md bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-ink-muted">
                {account.role}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default DemoAccounts
