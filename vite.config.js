import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    target: 'es2018',
    rollupOptions: {
      output: {
        manualChunks: {
          react_vendor: ['react', 'react-dom', 'react-router-dom'],
          mui_vendor: ['@mui/material', '@mui/icons-material'],
          redux_vendor: ['@reduxjs/toolkit', 'react-redux']
        }
      }
    }
  }
})
