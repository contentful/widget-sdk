const rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = './tools/eslint-rules';

module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier', 'prettier/react'],
  settings: {
    react: {
      version: '16.4.2'
    }
  },
  env: {
    browser: true,
    node: true
  },
  globals: {
    setTimeout: false,
    Promise: false,
    require: false
  },
  parser: 'babel-eslint',
  rules: {
    'react/display-name': 'off',
    'no-template-curly-in-string': 'off',
    'no-useless-return': 'off',
    'no-mixed-operators': 'off',
    'padded-blocks': ['warn', 'never'],
    'no-use-before-define': [
      'error',
      {
        functions: false,
        classes: false
      }
    ],
    'no-unused-vars': [
      'error',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'all',
        argsIgnorePattern: '^_'
      }
    ],
    'eol-last': 'warn',
    'require-yield': 'off'
  },
  overrides: [
    {
      files: ['src/javascripts/**/*.js'],
      excludedFiles: ['*.es6.js', '*.spec.js'],
      env: {
        browser: true,
        node: false
      },
      globals: {
        angular: false,
        _: false,
        JST: false,
        $: false
      }
    },
    {
      files: ['src/**/*.spec.js'],
      plugins: ['jest', 'rulesdir'],
      rules: {
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/no-jest-import': 'warn',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
        'jest/consistent-test-it': 'warn',
        'jest/no-jasmine-globals': 'warn',
        'jest/no-test-prefixes': 'error',
        'jest/prefer-to-be-null': 'warn',
        'jest/prefer-to-be-undefined': 'warn',
        'rulesdir/restrict-jest-fn': 'error',
        'rulesdir/restrict-sinon-assert': 'error'
      },
      parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module'
      },
      globals: {
        describe: true,
        it: true,
        test: true,
        expect: true,
        jest: true,
        spy: true
      }
    },
    {
      files: ['*.es6.js'],
      parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module'
      },
      rules: {
        'prefer-const': 'error',
        'no-var': 'error',
        'no-restricted-syntax': [
          'error',
          'BreakStatement',
          'ContinueStatement',
          'DebuggerStatement',
          'EmptyStatement',
          'ForStatement',
          'LabeledStatement',
          'MetaProperty',
          'SequenceExpression',
          'TaggedTemplateExpression',
          'UpdateExpression',
          'WithStatement'
        ]
      }
    }
  ]
};
