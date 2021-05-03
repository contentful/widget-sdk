module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['prettier', 'plugin:cypress/recommended'],
  plugins: ['cypress'],
  env: {
    'cypress/globals': true,
  },
};
