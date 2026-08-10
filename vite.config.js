import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' → ścieżki względne → działa na GitHub Pages niezależnie od nazwy repozytorium
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: { host: true, port: 5173, allowedHosts: true },
  preview: { host: true, port: 4173, allowedHosts: true },
  build: {
    chunkSizeWarningLimit: 900,
    target: 'es2020',
  },
})
