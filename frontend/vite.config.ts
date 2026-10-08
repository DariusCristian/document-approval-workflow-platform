import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    // A simulated browser (DOM, cookies) so React components can render in Node.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
