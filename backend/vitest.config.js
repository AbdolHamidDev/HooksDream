const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // MongoDB in-memory cần thời gian khởi động lần đầu (tải binary).
    testTimeout: 60000,
    hookTimeout: 120000,
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['utils/**/*.js', 'services/**/*.js', 'validators/**/*.js'],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});
