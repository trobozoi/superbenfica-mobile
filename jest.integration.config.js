/**
 * Testes de integração contra a API REAL (EXPO_PUBLIC_API_URL de teste em .env.test).
 * Usam a mesma camada de serviços do app; só os módulos nativos são trocados
 * por versões em memória. Rode com: npm run test:integration
 */
module.exports = {
  displayName: 'integration',
  testEnvironment: 'node',
  roots: ['<rootDir>/__integration__'],
  testMatch: ['**/*.int.test.ts'],
  globalSetup: '<rootDir>/__integration__/globalSetup.ts',
  setupFiles: ['<rootDir>/__integration__/setupEnv.ts'],
  testTimeout: 30_000,
  globals: { __DEV__: false },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/test/mocks/reactNative.ts',
    '^expo-constants$': '<rootDir>/test/mocks/expoConstants.integration.ts',
    '^expo-secure-store$': '<rootDir>/test/mocks/secureStore.ts',
    '^@react-native-async-storage/async-storage$':
      '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
};
