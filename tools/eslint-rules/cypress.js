module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['prettier', 'prettier/@typescript-eslint', 'plugin:cypress/recommended'],
  plugins: ['cypress'],
  env: {
    'cypress/globals': true,
  },
};
