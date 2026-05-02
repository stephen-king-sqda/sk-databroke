import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    // Allow any Host header so LAN clients (192.168.x.x, hostname.local, etc.)
    // can connect when the server is bound to 0.0.0.0 via --host.
    allowedHosts: true,
  },
  server: {
    allowedHosts: true,
  },
})
