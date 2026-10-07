/** Testes unitários (mocks, sem rede). Integração: jest.integration.config.js */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/__integration__/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/flash-list|immer|react-redux|@reduxjs/toolkit|redux|reselect)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/navigation/types.ts',
  ],
  coverageReporters: ['lcov', 'text-summary'],
};
