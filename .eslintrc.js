module.exports = {
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    semi: ['error', 'always'],
    quotes: ['error', 'single', { allowTemplateLiterals: true }],
  },
  globals: {
    vscode: 'readonly',
  },
};
