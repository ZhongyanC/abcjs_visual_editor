import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Force esbuild to pre-bundle the local CJS abcjs package → ESM
    include: ['abcjs'],
  },
})
