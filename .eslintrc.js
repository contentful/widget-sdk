const rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = './tools/eslint-rules/custom';

module.exports = {
  root: true,
  env: {
    /*
      We are setting `browser: false` and manually allowing which globals we want.
      This ensures that we catch overridden names such as `Navigator` .
    */
    browser: false,
    node: true,
    es6: true,
  },
  globals: {
    window: true,
    document: true,
  },
  settings: {
    linkComponents: ['TextLink', 'Button', 'DropdownListItem', 'StateLink'],
  },

  overrides: [
    {
      files: ['**/*.{js,jsx}'],
      extends: [
        require.resolve('./tools/eslint-rules/javascript.js'),
        require.resolve('./tools/eslint-rules/react.js'),
        require.resolve('./tools/eslint-rules/import.js'),
        require.resolve('./tools/eslint-rules/styles.js'),
      ],
    },
    {
      files: ['src/**/*.{ts,tsx}'],
      extends: [
        require.resolve('./tools/eslint-rules/typescript.js'),
        require.resolve('./tools/eslint-rules/react.js'),
        require.resolve('./tools/eslint-rules/import.js'),
        require.resolve('./tools/eslint-rules/styles.js'),
      ],
      rules: {
        'react/prop-types': 'off',
      },
    },
    {
      files: ['test/**/*.{ts,tsx}'],
      extends: [require.resolve('./tools/eslint-rules/cypress.js')],
    },
    {
      files: ['tools/**/*.ts'],
      extends: [require.resolve('./tools/eslint-rules/typescript.js')],
    },
    /**
     * Specific for core and features folders
     */
    {
      files: ['src/javascripts/core/**/*.{js,ts,tsx}', 'src/javascripts/features/**/*.{js,ts,tsx}'],
      rules: {
        'import/no-default-export': 'error',
        'import/named': 'error',
        'rulesdir/restrict-multiple-react-component-exports': 'error',
        'rulesdir/allow-only-import-export-in-index': 'error',
      },
    },
    /**
     * Jest tests
     */
    {
      files: [
        'src/**/*.spec.{js,ts,tsx}',
        'src/**/__tests__/**/*.{js,ts,tsx}',
        'src/javascripts/**/__mocks__/**/*.{js,ts,tsx}',
        'test/contract/**/*.spec.{js,ts,tsx}',
      ],
      extends: [require.resolve('./tools/eslint-rules/jest.js')],
    },
    /**
     * SVG files
     */
    {
      files: ['src/javascripts/svg/**/*.{js,ts,tsx}'],
      plugins: ['rulesdir'],
      rules: {
        'rulesdir/restrict-inline-styles': 'off',
      },
    },
  ],
};
