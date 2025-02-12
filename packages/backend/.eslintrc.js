module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/recommended'
  ],
  plugins: ['@typescript-eslint', 'jest'],
  env: {
    node: true,
    es6: true,
    jest: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_'
    }],
    '@typescript-eslint/ban-ts-comment': ['error', {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': false
    }],
    '@typescript-eslint/ban-types': ['error', {
      'types': {
        'Function': {
          'message': 'Avoid using the `Function` type. Specify the function shape instead.'
        }
      }
    }],
    '@typescript-eslint/no-var-requires': 'error',
    'no-unused-vars': 'off', // Use TypeScript's version instead
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error'
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
  settings: {
    jest: {
      version: 'detect'
    }
  }
}; 