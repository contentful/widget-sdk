const gulp = require('gulp');
const js = require('../js');
const clean = require('../clean');
const { processJadeTemplates } = require('../templates');
const { bundleAppJs, bundleTestJs } = require('./js');
const { buildMinifiedChunks, buildNonMinifiedChunks } = require('./chunks');
const buildStyles = require('./styles');

const buildTest = gulp.series(
  clean,
  gulp.parallel(
    gulp.series(
      gulp.parallel(js, processJadeTemplates),
      gulp.parallel(bundleTestJs, buildNonMinifiedChunks)
    ),
    buildStyles
  )
);

const buildApp = gulp.series(
  clean,
  gulp.parallel(
    gulp.series(
      gulp.parallel(js, processJadeTemplates),
      gulp.parallel(bundleAppJs, buildMinifiedChunks)
    ),
    buildStyles
  )
);

module.exports = {
  buildTest,
  buildApp
};
