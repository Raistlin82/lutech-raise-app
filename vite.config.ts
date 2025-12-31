import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // base path: use /lutech-raise-app/ for GitHub Pages, / for Vercel
  base: process.env.GITHUB_ACTIONS ? '/lutech-raise-app/' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries chunk
          'ui-vendor': ['lucide-react', 'react-hot-toast', 'clsx'],
          // Validation chunk
          'validation': ['zod'],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})
