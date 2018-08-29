const gulp = require('gulp');
const { assertFilesExist, mapFileContents } = require('./helpers');
const S = require('../lib/stream-utils');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const { supportedBrowsers } = require('../app-babel-options');

// all these files will be processed and concatenated into 1
// /public/app/sharejs.js
const SHAREJS_VENDOR_SRC = assertFilesExist([
  'node_modules/@contentful/sharejs/lib/types/web-prelude.js',
  'node_modules/@contentful/sharejs/lib/types/helpers.js',
  'node_modules/@contentful/sharejs/lib/types/text.js',
  'node_modules/@contentful/sharejs/lib/types/text-api.js',
  'node_modules/@contentful/sharejs/lib/types/json.js',
  'node_modules/@contentful/sharejs/lib/types/json-api.js'
]);

gulp.task('js/sharejs', function() {
  return S.pipe([
    gulp.src(SHAREJS_VENDOR_SRC),
    babel({
      babelrc: false,
      presets: [
        [
          'env',
          {
            targets: {
              browsers: supportedBrowsers
            },
            loose: true,
            debug: true,
            modules: false
          }
        ]
      ],
      plugins: ['transform-object-rest-spread', 'transform-class-properties']
    }),
    concat('sharejs-types.js'),
    mapFileContents(function(contents) {
      return `(function() { var WEB=true; ${contents}; }).call(this);`;
    }),
    gulp.dest('./public/app/')
  ]);
});
