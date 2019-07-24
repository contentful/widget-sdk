const rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = './tools/eslint-rules';

module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier', 'prettier/react'],
  settings: {
    react: {
      version: '16.8.0'
    },
    'import/resolver': {
      node: {
        moduleDirectory: ['src/javascripts', 'node_modules']
      }
    },
    'import/core-modules': ['legacy-client', 'localesList', 'marked', 'searchParser']
  },
  plugins: ['react-hooks'],
  env: {
    /*
      We are setting `browser: false` and manually allowing which globals we want.
      This ensures that we catch overridden names such as `Navigator` .
    */
    browser: false,
    node: true
  },
  globals: {
    setTimeout: false,
    Promise: false,
    ArrayBuffer: false,
    Uint8Array: false,
    window: true,
    document: true
  },
  parser: 'babel-eslint',
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'react/display-name': 'off',
    'react/prop-types': ['error', { ignore: ['children'] }],
    'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
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
    'require-yield': 'off',
    'no-restricted-syntax': [
      'error',
      'DebuggerStatement',
      'EmptyStatement',
      'LabeledStatement',
      'MetaProperty',
      'SequenceExpression',
      'TaggedTemplateExpression',
      'WithStatement'
    ],
    'no-var': 'error',
    'prefer-const': 'error'
    // todo: enable once we get rid of .es6
    // 'no-plusplus': ['warn', { allowForLoopAfterthoughts: true }],
    // 'object-shorthand': ['warn', 'properties']
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
        JST: false
      }
    },
    {
      files: [
        'src/**/*.spec.js',
        'src/**/__test__/**/*.js',
        'src/javascripts/**/__mocks__/**/*.js'
      ],
      plugins: ['jest', 'rulesdir'],
      rules: {
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/no-jest-import': 'warn',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
        'jest/consistent-test-it': ['warn', { fn: 'it' }],
        'jest/no-jasmine-globals': 'warn',
        'jest/no-test-prefixes': 'error',
        'jest/prefer-to-be-null': 'warn',
        'jest/prefer-to-be-undefined': 'warn',
        'rulesdir/restrict-sinon': 'error',
        'react/prop-types': 'off'
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
        spy: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true
      }
    },
    {
      files: ['src/javascripts/**/*.es6.js'],
      parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module'
      },
      plugins: ['rulesdir', 'import'],
      rules: {
        'import/no-unresolved': 'error',
        'rulesdir/relative-imports': 'error',
        'rulesdir/restrict-angular-require': 'error',
        'rulesdir/restrict-forma-css-in-react-components': 'warn',
        'rulesdir/restrict-non-f36-components': 'warn',
        'rulesdir/restrict-inline-styles': 'error'
      },
      globals: {
        JST: false
      }
    }
  ]
};
