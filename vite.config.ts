import { defineConfig } from 'vitest/config';

// GitHub Pages serves the site from /neon-sovereign/; local dev serves from /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/neon-sovereign/' : '/',
  test: {
    include: ['tests/**/*.test.ts'],
  },
}));
