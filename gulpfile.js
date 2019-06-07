'use strict';

require('@babel/polyfill');

// require('./tools/tasks/js'); // done conversion to exported job and updated tasks to use the fn instead of name 'js'

// require('./tools/tasks/clean'); // done conversion to exported job and updated tasks to use the fn instead of name 'clean'
// require('./tools/tasks/svg'); // done conversion to exported job and updated tasks to use the fn instead of name 'svg'
// require('./tools/tasks/copy'); // done conversion to exported job and updated tasks to use the fn instead of name 'copy-static'

// // done conversion to exported job and updated tasks to use the fns
// // instead of name 'stylesheets', 'stylesheets/app' and made
// // 'stylesheets/vendor' private as it's used only by 'stylesheets'
// require('./tools/tasks/stylesheets');

// require('./tools/tasks/templates'); // done conversion to exported job and updated tasks to use the fn instead of name 'templates'

// require('./tools/tasks/build/js'); // done conversion to exported job and updated tasks to use the fn instead of name 'build/js/test' and 'build/js/app'
// require('./tools/tasks/build/chunks'); // done conversion to exported job and updated tasks to use the fn instead of name 'build/chunks/test' and 'build/chunks'
// require('./tools/tasks/build/static'); // done conversion to exported job and updated tasks to use the fn instead of name 'build/static'
// require('./tools/tasks/build/styles'); // done conversion to exported job and updated tasks to use the fn instead of name 'build/styles'

const gulp = require('gulp');
// done conversion to exported job and updated tasks to use the fn instead of name 'all'
const all = require('./tools/tasks/all');
// done conversion to exported job and updated tasks to use the fn instead of name 'serve'
const serve = require('./tools/tasks/serve');
// done conversion to exported job and updated tasks to use the fn instead of name 'prepare-tests'
const prepareTests = require('./tools/tasks/prepare-tests');
// done conversion to exported job and updated tasks to use the fn instead of name 'build-app' and 'build-test'
const { buildTest, buildApp } = require('./tools/tasks/build/build');

// Gulp does not produce stack traces when logging errors.
// This workaround is not part of the public API and not documented so
// it might stop working at some point.
// Found it here: https://github.com/gulpjs/gulp/issues/105#issuecomment-40841985
gulp.on('err', function(e) {
  /* eslint no-console: off */
  console.error(e.err.stack);
});

module.exports['build-app'] = buildApp;
module.exports['build-test'] = buildTest;
module.exports['prepare-tests'] = prepareTests;
module.exports.all = all;
module.exports.serve = serve;
