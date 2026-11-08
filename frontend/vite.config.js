import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Em desenvolvimento (npm run dev), repassa para os containers do docker compose
    proxy: {
      '/api': 'http://localhost:8082',
      '/ice-servers': 'http://localhost:8080',
      '/socket.io': { target: 'http://localhost:8080', ws: true },
    },
  },
})
