'use-strict';

const path = require('path');

module.exports = (resolve, rootDir, srcRoots, coverageDirectory) => {
  const toRelRootDir = f => '<rootDir>/' + path.relative(rootDir || '', f);
  const config = {
    setupFilesAfterEnv: [resolve('tools/testing/setup-tests.js')],
    testMatch: ['**/?(*.)(spec|test).{js,jsx}'],
    // where to search for files/tests
    roots: srcRoots.map(toRelRootDir),
    collectCoverageFrom: ['**/*.js'],
    coverageDirectory,
    modulePaths: srcRoots.map(toRelRootDir),
    testEnvironment: 'jsdom',
    testURL: 'http://localhost',
    transform: {
      '^.+\\.(js|jsx)$': resolve('tools/testing/babel-transform.js'),
      '^(?!.*\\.(js|jsx|mjs|css|json)$)': resolve('tools/testing/file-transform.js')
    },
    transformIgnorePatterns: [
      '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs)$',
      '^.+\\.module\\.(css|sass|scss)$'
    ],
    moduleNameMapper: {
      '^.+\\.module\\.(css|sass|scss|styl)$': 'identity-obj-proxy'
    },
    moduleFileExtensions: ['web.js', 'js', 'json', 'web.jsx', 'jsx', 'node', 'mjs', 'es6.js'],
    coverageReporters: ['lcov', 'clover'],
    snapshotSerializers: ['jest-emotion']
  };
  if (rootDir) {
    config.rootDir = rootDir;
  }
  return config;
};
