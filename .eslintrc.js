module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    webextensions: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script',
  },
  globals: {
    chrome: 'readonly',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'BoldTake-*/',
    '*.min.js',
    'supabase.min.js',
    '*.user.js',
    'bulletproof-state-machine.js',
    'test/contentScript.test.js',
    'debug-extension.js',
    'fix-*.js',
    'extreme-audit.js',
  ],
  rules: {
    'no-console': 'off', // Allow console for extension debugging
    'no-unused-vars': 'off', // Too many false positives in extension code
    'no-debugger': 'error',
    'no-const-assign': 'error',
    'no-redeclare': 'error',
    'no-undef': 'off', // Too many globals in extension environment
    'no-constant-condition': 'off',
    'no-useless-escape': 'off',
    'no-inner-declarations': 'off',
    'semi': 'off',
    'quotes': 'off',
  },
  overrides: [
    {
      files: ['test/**/*.js', 'scripts/**/*.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
