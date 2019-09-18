const gulp = require('gulp');
const { build, buildTestDeps } = require('../js');
const clean = require('../clean');
const { processJadeTemplates } = require('../templates');
const { bundleAppJs, bundleTestJs } = require('./js');
const { buildMinifiedChunks, buildNonMinifiedChunks } = require('./chunks');
const buildStyles = require('./styles');

const buildTest = gulp.series(
  clean,
  gulp.parallel(
    gulp.series(
      gulp.parallel(buildTestDeps, processJadeTemplates),
      gulp.parallel(bundleTestJs, buildNonMinifiedChunks)
    ),
    buildStyles
  )
);

const buildApp = gulp.series(
  clean,
  gulp.parallel(
    gulp.series(
      gulp.parallel(build, processJadeTemplates),
      gulp.parallel(bundleAppJs, buildMinifiedChunks)
    ),
    buildStyles
  )
);

module.exports = {
  buildTest,
  buildApp
};
