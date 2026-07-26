import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
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
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.module.scss',
      ],
    },
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        plugins: [react()],
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
