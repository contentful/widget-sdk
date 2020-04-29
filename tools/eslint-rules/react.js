module.exports = {
  extends: ['plugin:react/recommended', 'prettier/react'],
  plugins: ['react-hooks'],
  settings: {
    react: {
      version: '16.10.2',
    },
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'react/display-name': 'off',
    'react/prop-types': ['error', { ignore: ['children'] }],
    'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
  },
};
