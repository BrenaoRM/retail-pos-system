import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Big-Burguer/',

  build: {
    // Chunks separados: vendor, router, supabase e app
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom'],
          router:   ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 300,
    minify: 'esbuild',
    target: 'esnext',
    esbuildOptions: {
      // Remove console.log e debugger no build de produção
      drop: ['console', 'debugger'],
    },
  },
});
