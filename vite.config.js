import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Copiar service worker a la raíz del build (M10)
    rollupOptions: {
      input: {
        main: './index.html',
      }
    }
  },

  server: {
    port: 3005,   // Cambiado de 3000 → 3005
    host: true,   // Necesario para PWA en móviles
    open: true
  }
})
