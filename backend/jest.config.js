/**
 * Jest configuration for backend UNIT and INTEGRATION tests.
 *
 * - Unit/integration specs live next to the code they test as `*.spec.ts`.
 * - The end-to-end suite (real MongoDB via Testcontainers) has its own config
 *   in `test/jest-e2e.json` and is run with `npm run test:e2e`.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  // Load reflect-metadata once so decorator metadata (class-transformer @Type,
  // nested validation) is available when a DTO is imported on its own.
  setupFiles: ['reflect-metadata'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.module.ts', '!main.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
