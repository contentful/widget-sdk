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
    'rulesdir/relative-imports': 'error',
    'no-restricted-imports': [
      'error',
      {
        name: 'react-router',
        message: 'Please use import from `core/react-routing` instead.',
      },
      {
        name: 'react-router-dom',
        message: 'Please use import from `core/react-routing` instead.',
      },
    ],
  },
};
