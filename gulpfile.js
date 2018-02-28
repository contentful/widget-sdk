'use strict';

// this is needed for `svg` task. As soon as we move to webpack and
// use `svg-loader`, it should become unnecessary
// TODO: remove after migration to webpack
require('babel-register')({
  // this configuration is valid only for gulp tasks
  // so if it will be in `.babelrc`, it can create
  // confusion
  'presets': [['env', {
    'targets': {
      'node': 'current'
    }
  }]]
});

require('babel-polyfill');

require('./tools/tasks/build/build');
require('./tools/tasks/build/js');
require('./tools/tasks/build/static');
require('./tools/tasks/build/styles');

require('./tools/tasks/all');
require('./tools/tasks/clean');
require('./tools/tasks/copy');
require('./tools/tasks/js');
require('./tools/tasks/prepare-tests');
require('./tools/tasks/serve');
require('./tools/tasks/styleguide');
require('./tools/tasks/stylesheets');
require('./tools/tasks/svg');
require('./tools/tasks/templates');

const gulp = require('gulp');

// we need to add this line in order to run binaries installed via npm locally
// right now we use only for `tools/tasks/styleguide`, to generate our styleguide
// Probably we can just call `npx`, after we move to node@8+
// about npx & npm – https://github.com/npm/npm/releases/tag/v5.2.0
process.env['PATH'] += ':./node_modules/.bin';

// Gulp does not produce stack traces when logging errors.
// This workaround is not part of the public API and not documented so
// it might stop working at some point.
// Found it here: https://github.com/gulpjs/gulp/issues/105#issuecomment-40841985
gulp.on('err', function (e) {
  /* eslint no-console: off */
  console.error(e.err.stack);
});
