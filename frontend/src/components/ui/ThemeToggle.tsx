import { useState } from 'react'
import { getThemePreference, setThemePreference } from '../../app/theme'
import type { ThemePreference } from '../../app/theme'
import { cn } from '../../utils/cn'
import { MonitorIcon, MoonIcon, SunIcon } from './icons'

const options = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
] as const

interface ThemeToggleProps {
  className?: string
}

// Three small icon buttons: Light, Dark, System. The chosen one is highlighted.
function ThemeToggle({ className }: ThemeToggleProps) {
  const [preference, setPreference] = useState<ThemePreference>(getThemePreference)

  const choose = (value: ThemePreference) => {
    setThemePreference(value)
    setPreference(value)
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn('flex items-center gap-0.5 rounded-lg bg-surface-muted p-0.5', className)}
    >
      {options.map(({ value, label, Icon }) => {
        const isActive = preference === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => choose(value)}
            className={cn(
              'flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors',
              'focus-visible:outline-2 focus-visible:outline-accent',
              isActive ? 'bg-surface text-ink shadow-xs' : 'text-ink-subtle hover:text-ink',
            )}
          >
            <Icon className="size-4" />
          </button>
        )
      })}
    </div>
  )
}

export default ThemeToggle
