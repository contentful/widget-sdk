'use strict';

require('babel-polyfill');

require('./tools/tasks/build/build');
require('./tools/tasks/build/js');
require('./tools/tasks/build/chunks');
require('./tools/tasks/build/static');
require('./tools/tasks/build/styles');

require('./tools/tasks/all');
require('./tools/tasks/clean');
require('./tools/tasks/copy');
require('./tools/tasks/js');
require('./tools/tasks/js-sharejs');
require('./tools/tasks/prepare-tests');
require('./tools/tasks/serve');
require('./tools/tasks/stylesheets');
require('./tools/tasks/svg');
require('./tools/tasks/templates');

const gulp = require('gulp');

// Gulp does not produce stack traces when logging errors.
// This workaround is not part of the public API and not documented so
// it might stop working at some point.
// Found it here: https://github.com/gulpjs/gulp/issues/105#issuecomment-40841985
gulp.on('err', function(e) {
  /* eslint no-console: off */
  console.error(e.err.stack);
});
