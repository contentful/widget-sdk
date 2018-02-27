const gulp = require('gulp');
const { assertFilesExist, mapFileContents } = require('./helpers');
const S = require('../lib/stream-utils');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

const BROWSER_TARGET = ['last 2 versions', 'ie >= 10'];

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

const KALTURA_VENDOR_SRC = assertFilesExist([
  'vendor/kaltura-16-01-2014/webtoolkit.md5.js',
  'vendor/kaltura-16-01-2014/ox.ajast.js',
  'vendor/kaltura-16-01-2014/KalturaClientBase.js',
  'vendor/kaltura-16-01-2014/KalturaTypes.js',
  'vendor/kaltura-16-01-2014/KalturaVO.js',
  'vendor/kaltura-16-01-2014/KalturaServices.js',
  'vendor/kaltura-16-01-2014/KalturaClient.js'
]);

gulp.task('js/vendor/sharejs', function () {
  return S.pipe([
    gulp.src(SHAREJS_VENDOR_SRC),
    babel({
      babelrc: false,
      presets: [
        ['env', {
          'targets': {
            'browsers': BROWSER_TARGET
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

gulp.task('js/vendor/kaltura', function () {
  return gulp.src(KALTURA_VENDOR_SRC)
    .pipe(concat('kaltura.js'))
    .pipe(gulp.dest('./public/app'));
});
