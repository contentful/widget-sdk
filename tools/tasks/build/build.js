const gulp = require('gulp');
const { build } = require('../js');
const clean = require('../clean');
const { processJadeTemplates } = require('../templates');
const { bundleAppJs } = require('./js');
const { buildMinifiedChunks } = require('./chunks');
const buildStyles = require('./styles');

const buildTest = gulp.series(clean, gulp.parallel(processJadeTemplates, buildStyles));

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
