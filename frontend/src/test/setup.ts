import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Remove what the previous test rendered, so every test starts with an empty page.
afterEach(() => {
  cleanup()
})
