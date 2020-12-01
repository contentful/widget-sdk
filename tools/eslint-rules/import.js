const jsExtensions = ['.js', '.jsx'];
const tsExtensions = ['.ts', '.tsx'];
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
        config: 'tools/webpack.config.js',
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
  },
};
