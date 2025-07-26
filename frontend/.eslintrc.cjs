module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['react', '@typescript-eslint'],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'prefer-const': 'error'
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
