import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.terraform/**',
      '**/build/**',
      'playwright-report/**',
      'test-results/**'
    ]
  },
  {
    files: ['apps/**/*.ts', 'apps/**/*.tsx', 'e2e/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      'no-unused-vars': 'off'
    }
  }
];
