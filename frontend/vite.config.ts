import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

/**
 * Configurazione unica di Vite: sviluppo, build di produzione e test.
 *
 * Erano due file — `vite.config.js` per la build e questo per i test — con lo
 * stesso alias scritto due volte. Vitest però ignora del tutto il primo, quindi
 * le due configurazioni potevano divergere senza che nulla se ne accorgesse: chi
 * gira in sviluppo e chi gira nei test non sarebbero più stati lo stesso
 * programma. Il plugin React resta ripetuto in ogni progetto perché i progetti
 * di Vitest non ereditano i plugin della radice.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  optimizeDeps: {
    include: ['axios', '@tanstack/react-query', 'react', 'react-dom', 'react-router'],
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/api/generated/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.browser.test.{ts,tsx}',
        'src/app/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.module.scss',
      ],
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.{ts,tsx}'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        define: {
          'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:59999'),
        },
        test: {
          name: 'e2e',
          include: ['e2e/**/*.e2e.test.{ts,tsx}'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
