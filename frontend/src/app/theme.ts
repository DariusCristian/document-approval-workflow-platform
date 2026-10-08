// The user's theme choice. Only a display preference, so localStorage is fine here.
// index.html has a small copy of applyTheme's logic that runs before React (keep the key in sync).

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'docflow-theme'
const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)')

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch {
    // Storage can be blocked (e.g. some private modes): fall back to the system setting.
  }
  return 'system'
}

// Adds or removes the "dark" class on <html>; all dark colors hang off that class.
function applyTheme(preference: ThemePreference) {
  const isDark = preference === 'dark' || (preference === 'system' && systemDarkQuery.matches)
  document.documentElement.classList.toggle('dark', isDark)
  // index.html sets this inline before React loads; keep it in step, or native controls
  // and scrollbars would stay in the theme the page was loaded with.
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, preference)
    }
  } catch {
    // Not saved, but the theme still changes for this visit.
  }
  applyTheme(preference)
}

// Called once at startup: when the choice is "System", follow the OS switching live.
export function watchSystemTheme() {
  applyTheme(getThemePreference())
  systemDarkQuery.addEventListener('change', () => {
    if (getThemePreference() === 'system') {
      applyTheme('system')
    }
  })
}
