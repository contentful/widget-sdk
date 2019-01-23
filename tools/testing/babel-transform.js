'use strict';

const babelJest = require('babel-jest');
const { createBabelOptions } = require('../app-babel-options');

module.exports = babelJest.createTransformer(
  createBabelOptions({
    babelrc: false,
    angularModules: false,
    modules: 'commonjs'
  })
);
