const gulp = require('gulp');
const { build, buildTestDeps } = require('../js');
const clean = require('../clean');
const { bundleAppJs, bundleTestJs } = require('./js');
const { buildMinifiedChunks, buildNonMinifiedChunks } = require('./chunks');
const buildStyles = require('./styles');

const buildTest = gulp.series(
  clean,
  gulp.parallel(
    gulp.series(buildTestDeps, gulp.parallel(bundleTestJs, buildNonMinifiedChunks)),
    buildStyles
  )
);

const buildApp = gulp.series(
  clean,
  gulp.parallel(gulp.series(build, gulp.parallel(bundleAppJs, buildMinifiedChunks)), buildStyles)
);

module.exports = {
  buildTest,
  buildApp
};
