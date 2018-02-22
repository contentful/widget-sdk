const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const gulp = require('gulp');
const concat = require('gulp-concat');
const sourceMaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');

const makeBabelOptions = require('../app-babel-options').makeOptions;
const { assertFilesExist, passError, mapFileContents } = require('./helpers');
const S = require('../lib/stream-utils');
const _ = require('lodash');

const BROWSER_TARGET = ['last 2 versions', 'ie >= 10'];

// All Angular modules except 'cf.lib'
const COMPONENTS_SRC = [
  'src/javascripts/**/*.js',
  '!src/javascripts/libs/*.js',
  '!src/javascripts/prelude.js'
];

const MAIN_VENDOR_SRC = assertFilesExist([
  'node_modules/jquery/dist/jquery.js',
  // Custom jQuery UI build: see the file for version and contents
  'vendor/jquery-ui/jquery-ui.js',
  'node_modules/jquery-textrange/jquery-textrange.js',
  'node_modules/angular/angular.js',
  'node_modules/angular-animate/angular-animate.js',
  'node_modules/angular-load/angular-load.js',
  'node_modules/angular-sanitize/angular-sanitize.js',
  'node_modules/angular-ui-sortable/dist/sortable.js',
  'node_modules/angular-ui-router/release/angular-ui-router.js',
  'node_modules/bootstrap/js/tooltip.js',
  'node_modules/browserchannel/dist/bcsocket-uncompressed.js'
]).concat([
  // Generated from the files below during the build
  'public/app/sharejs.js'
]);

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

const SNOWPLOW_VENDOR_SRC = assertFilesExist([
  'vendor/snowplow/sp-2.6.2.js'
]);

gulp.task('js', [
  'js/external-bundle',
  'js/app',
  'js/vendor'
]);

gulp.task('js/vendor', [
  'js/vendor/main',
  'js/vendor/kaltura',
  'js/vendor/snowplow'
]);

gulp.task('js/vendor/main', ['js/vendor/sharejs'], function () {
  // Use `base: '.'` for correct source map paths
  return gulp.src(MAIN_VENDOR_SRC, {base: '.'})
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.js'))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(gulp.dest('./public/app'));
});

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

gulp.task('js/vendor/snowplow', function () {
  return gulp.src(SNOWPLOW_VENDOR_SRC)
    .pipe(concat('snowplow.js'))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('js/vendor/kaltura', function () {
  return gulp.src(KALTURA_VENDOR_SRC)
    .pipe(uglify())
    .pipe(concat('kaltura.js'))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('js/external-bundle', function () {
  return bundleBrowserify(createBrowserify());
});

gulp.task('js/app', function () {
  return S.pipe([
    S.join([
      // Use `base: '.'` for correct source map paths
      gulp.src('src/javascripts/prelude.js', {base: '.'}),
      gulp.src(COMPONENTS_SRC, {base: '.'})
    ]),
    sourceMaps.init(),
    babel(makeBabelOptions({
      browserTargets: BROWSER_TARGET
    })),
    concat('components.js'),
    sourceMaps.write({sourceRoot: '/'}),
    gulp.dest('./public/app/')
  ]);
});

function createBrowserify (args) {
  return browserify(_.extend({debug: true}, args))
    .add('./src/javascripts/libs')
    .transform({optimize: 'size'}, 'browserify-pegjs')
    .transform('loose-envify', {global: true}); // Making React smaller and faster
}

function bundleBrowserify (browserify) {
  const dest = gulp.dest('./public/app/');
  return browserify.bundle()
    .on('error', passError(dest))
    .pipe(source('libs.js'))
    .pipe(buffer())
    // Add root to source map
    .pipe(sourceMaps.init({loadMaps: true, largeFile: true}))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(dest);
}
