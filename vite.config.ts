import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3080,
    host: '0.0.0.0', // 允许通过本机 IP（如 10.255.255.254:3080）访问，WSL2 下更稳定
    strictPort: false,
  },
})
