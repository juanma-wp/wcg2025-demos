import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Development proxy to handle CORS (optional - use WordPress CORS setup instead)
    // proxy: {
    //   '/wp-json': {
    //     target: 'https://wcg2025-demo.wp.local',
    //     changeOrigin: true,
    //     secure: false
    //   }
    // }
  }
})