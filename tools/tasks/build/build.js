const gulp = require('gulp');
const { build, buildTestDeps } = require('../js');
const clean = require('../clean');
const copyStatic = require('./static');

const buildTest = gulp.series(clean, buildTestDeps);

const buildApp = gulp.series(clean, gulp.series(build, copyStatic));

module.exports = {
  buildTest,
  buildApp
};
