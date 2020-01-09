'use strict';

require('@babel/polyfill');

const gulp = require('gulp');
const clean = require('./tools/tasks/clean');

// Gulp does not produce stack traces when logging errors.
// This workaround is not part of the public API and not documented so
// it might stop working at some point.
// Found it here: https://github.com/gulpjs/gulp/issues/105#issuecomment-40841985
gulp.on('err', e => {
  /* eslint no-console: off */
  console.error(e.err.stack);
});

module.exports.clean = clean;
