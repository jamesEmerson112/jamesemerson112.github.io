import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  // Resolve the browser build of svelte in tests so lifecycle callbacks
  // (onMount etc.) actually run under jsdom instead of the SSR no-ops.
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,ts}', 'scripts/**/*.test.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html']
    }
  }
});
