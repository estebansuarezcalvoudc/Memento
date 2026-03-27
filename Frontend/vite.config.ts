import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/preSetup.ts', './tests/setup.ts'],
    css: false,
    environmentOptions: {
      jsdom: {
        url: 'https://esteban-suarez-tfg.duckdns.org',
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['esteban-suarez-tfg.duckdns.org'],
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
        ws: true,
      },
    },
  },
})
