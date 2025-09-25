module.exports = {
  extends: ['eslint:recommended', 'plugin:security/recommended'],
  env: {
    browser: true,
    webextensions: true,
    jest: true,
    es2021: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script'
  },
  rules: {
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'no-unused-vars': 'warn',
    'no-undef': 'error'
  },
  ignorePatterns: [
    'node_modules/',
    'BoldTake-*/',
    'boldtake all versions/',
    '*.min.js',
    'supabase.min.js'
  ]
};
