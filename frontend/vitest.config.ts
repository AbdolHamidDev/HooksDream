// Cấu hình Vitest cho frontend.
// Tách riêng khỏi vite.config.ts vì không muốn kéo vite-plugin-pwa và
// node-polyfills vào môi trường test — chúng không cần thiết và làm chậm.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/utils/**', 'src/hooks/**', 'src/services/**'],
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 35,
        statements: 40,
      },
    },
  },
});
