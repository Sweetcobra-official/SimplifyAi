import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey =
    env.VITE_IO_INTELLIGENCE_API_KEY ||
    env.IO_INTELLIGENCE_API_KEY ||
    process.env.VITE_IO_INTELLIGENCE_API_KEY ||
    process.env.IO_INTELLIGENCE_API_KEY ||
    '';

  return {
    base: './',
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_IO_INTELLIGENCE_API_KEY': JSON.stringify(apiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
