const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const baseConfig = {
  moduleNameMapper: {
    '^@/lib/prisma$': '<rootDir>/__mocks__/prisma.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  clearMocks: true,
};

module.exports = createJestConfig({
  ...baseConfig,
  projects: [
    {
      displayName: 'api',
      testEnvironment: 'node',
      testMatch: ['**/*.spec.js'],
      testPathIgnorePatterns: ['/node_modules/', '/.next/', '/src/app/parqueo/'],
      moduleNameMapper: { '^@/lib/prisma$': '<rootDir>/__mocks__/prisma.js', '^@/(.*)$': '<rootDir>/src/$1' },
      setupFiles: ['<rootDir>/jest.setup.js'],
      transform: {
        '^.+\\.(js|jsx|mjs)$': ['babel-jest', { configFile: './babel.config.test.js' }],
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(uuid)/)',
      ],
    },
    {
      displayName: 'ui',
      testEnvironment: 'jsdom',
      testMatch: ['**/src/app/parqueo/**/*.spec.js'],
      moduleNameMapper: { '^@/lib/prisma$': '<rootDir>/__mocks__/prisma.js', '^@/(.*)$': '<rootDir>/src/$1' },
      setupFilesAfterEnv: ['@testing-library/jest-dom'],
      setupFiles: ['<rootDir>/jest.setup.js'],
      transform: {
        '^.+\\.(js|jsx|mjs)$': ['babel-jest', { configFile: './babel.config.test.js' }],
      },
    },
  ],
  collectCoverageFrom: [
    'src/app/api/parqueo/**/*.js',
    'src/lib/*.js',
    '!src/lib/api.js',
    '!**/*.spec.js',
  ],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 70, statements: 80 },
  },
});
