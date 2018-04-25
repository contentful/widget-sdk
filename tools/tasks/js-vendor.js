const gulp = require('gulp');
const { assertFilesExist, mapFileContents } = require('./helpers');
const S = require('../lib/stream-utils');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const { supportedBrowsers } = require('../app-babel-options');

// all these files will be processed and concatenated into 1
// /public/app/sharejs.js
const SHAREJS_VENDOR_SRC = assertFilesExist([
  'vendor/sharejs/lib/client/web-prelude.js',
  'vendor/sharejs/lib/client/microevent.js',
  'vendor/sharejs/lib/types/helpers.js',
  'vendor/sharejs/lib/types/text.js',
  'vendor/sharejs/lib/types/text-api.js',
  'vendor/sharejs/lib/client/doc.js',
  'vendor/sharejs/lib/client/connection.js',
  'vendor/sharejs/lib/client/index.js',
  'vendor/sharejs/lib/client/textarea.js',

  'vendor/sharejs/lib/types/web-prelude.js',
  'vendor/sharejs/lib/types/json.js',
  'vendor/sharejs/lib/types/json-api.js'
]);

gulp.task('js/vendor', ['js/vendor/sharejs']);

gulp.task('js/vendor/sharejs', function () {
  return S.pipe([
    gulp.src(SHAREJS_VENDOR_SRC),
    babel({
      babelrc: false,
      presets: [
        ['env', {
          'targets': {
            'browsers': supportedBrowsers
          },
          'loose': true,
          'debug': true,
          'modules': false
        }]
      ],
      plugins: [
        'transform-object-rest-spread'
      ]
    }),
    concat('sharejs.js'),
    mapFileContents(function (contents) {
      return `(function() { var WEB=true; ${contents}; }).call(this);`;
    }),
    gulp.dest('./public/app/')
  ]);
});
