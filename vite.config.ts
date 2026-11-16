import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Web is deployed under a subpath (GitHub Pages). The Capacitor WebView loads
// from https://localhost/, so native builds use relative asset paths instead.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: mode === 'capacitor' ? './' : env.VITE_BASE_PATH || '/dorymo/',
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
    },
  };
});
