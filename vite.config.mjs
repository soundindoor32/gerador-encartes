import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' para o app abrir os arquivos direto do disco (sem servidor)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true }
});
