// Backend Testing Infrastructure
// Backend Testing Infrastructure - ESM Configuration
export default {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
  ],
  testTimeout: 30000,
  collectCoverageFrom: [
    'server*.js',
    'drizzle/**/*.js',
    'middleware/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'utils/**/*.js',
    '!tests/**',
    '!coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/dist/'],
  transform: {},
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};