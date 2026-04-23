import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Big-Burguer/',

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-router-dom')) return 'router';
          if (id.includes('react') || id.includes('react-dom')) return 'vendor';
          if (id.includes('@supabase')) return 'supabase';
        },
      },
    },
    chunkSizeWarningLimit: 300,
    minify: 'oxc',        // ← era 'esbuild', agora usa OXC nativo do Vite 8
    target: 'esnext',
    oxcOptions: {         // ← era 'esbuildOptions'
      drop: ['console', 'debugger'],
    },
  },
});