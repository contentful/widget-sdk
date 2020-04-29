module.exports = {
  extends: ['eslint:recommended', 'prettier'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'module',
  },
  plugins: ['rulesdir'],
  rules: {
    'rulesdir/restrict-angular-require': 'error',

    'rulesdir/enforce-getModule-call-inside-fn': 'error',

    'no-template-curly-in-string': 'off',
    'no-useless-return': 'off',
    'no-mixed-operators': 'off',
    'no-prototype-builtins': 'off',
    'padded-blocks': ['warn', 'never'],
    'no-use-before-define': [
      'error',
      {
        functions: false,
        classes: false,
      },
    ],
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'all',
        argsIgnorePattern: '^_',
      },
    ],
    'eol-last': 'warn',
    'require-yield': 'off',
    'no-restricted-syntax': [
      'error',
      'DebuggerStatement',
      'EmptyStatement',
      'LabeledStatement',
      'MetaProperty',
      'SequenceExpression',
      'TaggedTemplateExpression',
      'WithStatement',
    ],
    'no-var': 'error',
    'prefer-const': 'error',
    // todo: enable once we get rid of .es6
    // 'no-plusplus': ['warn', { allowForLoopAfterthoughts: true }],
    // 'object-shorthand': ['warn', 'properties']
  },
};
