import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const DOMAIN = process.env.DOMAIN || 'localhost'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/preSetup.ts', './tests/setup.ts'],
    css: false,
    environmentOptions: {
      jsdom: {
        url: `https://${DOMAIN}`,
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: [DOMAIN],
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
