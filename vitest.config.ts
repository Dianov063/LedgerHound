/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // tsconfig keeps JSX for Next.js to compile; component tests need it compiled here.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // next-intl 4 is ESM-only and imports 'next/server' without an extension; Node cannot resolve that
    // for an externalized dependency, so Vite processes next-intl itself (next-intl's testing guide).
    server: { deps: { inline: ['next-intl'] } },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
