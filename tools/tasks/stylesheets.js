const gulp = require('gulp');
const { assertFilesExist, mapFileContents, buildStylus } = require('./helpers');
const sourceMaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');

const CSS_COMMENT_RE = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;

const VENDOR_STYLESHEETS_SRC = assertFilesExist([
  './node_modules/react-tippy/dist/tippy.css',
  './node_modules/contentful-ui-extensions-sdk/dist/cf-extension.css',
  './vendor/font-awesome/font-awesome.css',
  // Not sure if we need this
  './vendor/html5reset-1.6.1.css',
  // Custom jQuery UI build: see the file for version and contents
  './vendor/jquery-ui/jquery-ui.css',
  './node_modules/codemirror/lib/codemirror.css',
  // Add angular styles since we are disabling inline-styles in ngCsp
  './node_modules/angular/angular-csp.css',
  './node_modules/@contentful/ui-component-library/dist/styles.css'
]);

gulp.task('stylesheets', [
  'stylesheets/vendor',
  'stylesheets/app'
]);

gulp.task('stylesheets/vendor', function () {
  // Use `base: '.'` for correct source map paths
  return gulp.src(VENDOR_STYLESHEETS_SRC, {base: '.'})
    // Some of the vendor styles contain CSS comments that
    // break 'rework'. We remove them here.
    // See https://github.com/reworkcss/css/issues/24
    .pipe(mapFileContents(function (contents) {
      return contents.replace(CSS_COMMENT_RE, '');
    }))
    .pipe(sourceMaps.init())
    .pipe(concat('vendor.css'))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(gulp.dest('./public/app'));
});

gulp.task('stylesheets/app', function () {
  return buildStylus('src/stylesheets/main.styl', './public/app');
});
