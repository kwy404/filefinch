import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/unit-*.test.js', 'test/site-*.test.js'],
    environment: 'node',
    setupFiles: ['test/unit-setup.js'],
    // Transfer tests run real timers; a busy CI machine gets more time before a test is called stuck.
    testTimeout: 30000,
  },
});
