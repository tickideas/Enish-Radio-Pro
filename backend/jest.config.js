// Backend Testing Infrastructure
// Jest configuration for comprehensive testing

const config = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/backend/tests/**/*.test.js',
    '<rootDir>/backend/tests/**/*.spec.js',
  ],
  testTimeout: 30000,
  collectCoverageFrom: [
    'backend/server*.js',
    'backend/drizzle/**/*.js',
    'backend/middleware/**/*.js',
    'backend/models/**/*.js',
    'backend/routes/**/*.js',
    'backend/utils/**/*.js',
    '!backend/tests/**',
    '!backend/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary',
  ],
  setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
  ],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

module.exports = config;