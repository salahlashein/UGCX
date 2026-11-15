module.exports = {
  root: true,
  extends: ['../../.eslintrc.js'],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  ignorePatterns: ['.next', 'node_modules', 'next-env.d.ts', '.eslintrc.js'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
