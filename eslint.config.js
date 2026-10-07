// ESLint (flat config): regras do Expo + SonarJS (mesmas regras do SonarQube) + Prettier.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const sonarjs = require('eslint-plugin-sonarjs');
const prettierRecommended = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  sonarjs.configs.recommended,
  prettierRecommended,
  {
    ignores: ['node_modules/', 'coverage/', 'dist/', '.expo/', 'android/', 'ios/', '.scannerwork/'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' },
      ],
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'sonarjs/cognitive-complexity': ['error', 15],
      // TODOs são rastreados no Sonar como "info"; não devem quebrar o lint.
      'sonarjs/todo-tag': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'test/**', '__integration__/**'],
    rules: {
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
    },
  },
  {
    files: ['*.config.js', 'babel.config.js', 'eslint.config.js', 'jest.*.js'],
    languageOptions: {
      globals: {
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
]);
