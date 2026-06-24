import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Divide o bundle em chunks menores
    rollupOptions: {
      output: {
        manualChunks: {
          // Bibliotecas de UI em um chunk separado
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-ui': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            'lucide-react',
            'cmdk',
          ],
          'vendor-router': ['wouter'],
        },
      },
    },
    // Aumenta o limite do aviso (os chunks individuais serão menores)
    chunkSizeWarningLimit: 600,
  },
})
