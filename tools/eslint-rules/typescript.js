module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  plugins: ['rulesdir'],
  rules: {
    'rulesdir/restrict-angular-require': 'error',
    'rulesdir/enforce-getModule-call-inside-fn': 'error',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
  },
};
