import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Inafanya app ijisasasishe yenyewe ukibadilisha code
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'RoomHive PRO Dashboard',
        short_name: 'RoomHive',
        description: 'Smart Hotel Management System',
        theme_color: '#18365c', // Rangi yako pendwa ya blue iliyokoza
        background_color: '#f8fafc',
        display: 'standalone', // Inaifanya ionekane kama App kamili (inaficha browser UI)
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});