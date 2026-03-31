import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
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
