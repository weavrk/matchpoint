import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3500,
    fs: {
      // Allow importing shared assets from repo root (e.g. assets/logo-and-backgrounds)
      allow: [path.resolve(__dirname, '..')],
    },
  },
})
