import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

/**
 * Vitest configuration with three separate projects, one per level of the
 * testing pyramid:
 *
 *  - `unit`    — pure logic (metrics, star rating, game data, settings) run in
 *                Node. Fast, no DOM, no browser. These are the most numerous.
 *  - `browser` — component tests that render real React components inside a real
 *                Chromium browser via Playwright (`*.browser.test.tsx`).
 *  - `e2e`     — end-to-end tests that drive a full user flow in the browser,
 *                kept in a dedicated `e2e/` directory (`*.e2e.test.tsx`).
 *
 * Run everything with `npm test`; a single level with e.g.
 * `npm test -- --project unit`.
 */
export default defineConfig({
  // Pre-bundle these so the browser projects don't reload mid-run when a test
  // first imports them (avoids Vitest's "unexpectedly reloaded" flakiness).
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
        // 1. Unit tests — Node environment, no browser.
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.{ts,tsx}'],
          environment: 'node',
        },
      },
      {
        // 2. Component tests — real browser via Playwright.
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
        // 3. End-to-end tests — full user flows in a real browser.
        plugins: [react()],
        // The E2E runs without a backend, so every request must fail as a
        // connection error. Left on the default port it would reach a backend
        // running on the developer's machine, get a 401 for its fake token, and
        // the 401 handler would log the app out mid-flow. Pointing at a dead
        // port makes the run identical with or without a local backend.
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
