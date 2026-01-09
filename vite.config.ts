import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  // Use VITE_BASE_PATH env var for Kyma (/), default to GitHub Pages path
  const basePath = env.VITE_BASE_PATH || '/lutech-raise-app/';

  // E2E mode flag - when true, mandatory checkpoints are bypassed for testing
  // Check both loadEnv result and process.env (playwright passes env vars via process.env)
  const isE2EMode = env.VITE_E2E_MODE === 'true' || process.env.VITE_E2E_MODE === 'true';

  return {
    base: basePath,
    plugins: [react()],
    define: {
      // Expose E2E mode to the application
      '__E2E_MODE__': JSON.stringify(isE2EMode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
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
  }
})
