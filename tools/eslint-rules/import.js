const path = require('path');
const jsExtensions = ['.js', '.jsx'];
const tsExtensions = ['.d.ts', '.ts', '.tsx'];
const allExtensions = jsExtensions.concat(tsExtensions);

module.exports = {
  plugins: ['import'],
  settings: {
    'import/ignore': ['node_modules'],
    'import/extensions': allExtensions,
    'import/parsers': {
      '@typescript-eslint/parser': tsExtensions,
    },
    'import/resolver': {
      webpack: {
        config: 'webpack.config.js',
      },
      node: {
        extensions: allExtensions,
      },
    },
  },
  rules: {
    'import/no-unresolved': 'error',
    'import/default': 'error',
    'import/export': 'error',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'error',
    'import/no-unused-modules': [
      'off',
      {
        missingExports: false,
        unusedExports: true,
        src: [path.resolve(process.cwd(), 'src/javascripts')],
      },
    ],
    'import/no-anonymous-default-export': [
      'error',
      {
        allowArray: false,
        allowArrowFunction: false,
        allowAnonymousClass: false,
        allowAnonymousFunction: false,
        allowCallExpression: true, // The true value here is for backward compatibility
        allowLiteral: false,
        allowObject: true,
      },
    ],
    'rulesdir/relative-imports': 'error',
    'no-restricted-imports': [
      'error',
      {
        name: 'react-router',
        message: 'Please use import from `core/react-routing` instead',
      },
      {
        name: 'react-router-dom',
        message: 'Please use import from `core/react-routing` instead',
      },
      {
        name: '@contentful/experience-error-tracking',
        message: 'Please use import from `core/monitoring` only',
      },
    ],
  },
};
