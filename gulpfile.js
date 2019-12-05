'use strict';

require('@babel/polyfill');

const gulp = require('gulp');
const all = require('./tools/tasks/all');
const serve = require('./tools/tasks/serve');
const prepareTests = require('./tools/tasks/prepare-tests');
const { processJadeTemplates } = require('./tools/tasks/templates');
const { buildTest, buildApp } = require('./tools/tasks/build/build');

// Gulp does not produce stack traces when logging errors.
// This workaround is not part of the public API and not documented so
// it might stop working at some point.
// Found it here: https://github.com/gulpjs/gulp/issues/105#issuecomment-40841985
gulp.on('err', e => {
  /* eslint no-console: off */
  console.error(e.err.stack);
});

module.exports['build-app'] = buildApp;
module.exports['build-test'] = buildTest;
module.exports['prepare-tests'] = prepareTests;
module.exports.all = all;
module.exports.serve = serve;
module.exports.templates = processJadeTemplates;
