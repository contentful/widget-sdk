const gulp = require('gulp');
const { assertFilesExist, mapFileContents } = require('./helpers');
const sourceMaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');

const CSS_COMMENT_RE = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g;

const VENDOR_STYLESHEETS_SRC = assertFilesExist([
  './vendor/font-awesome/font-awesome.css',
  // Not sure if we need this
  './vendor/html5reset-1.6.1.css',
  './node_modules/codemirror/lib/codemirror.css',
  // Add angular styles since we are disabling inline-styles in ngCsp
  './node_modules/angular/angular-csp.css',
  './node_modules/@contentful/forma-36-react-components/dist/styles.css',
  './node_modules/@contentful/forma-36-fcss/dist/styles.css'
]);

function processVendorStylesheets() {
  // Use `base: '.'` for correct source map paths
  return (
    gulp
      .src(VENDOR_STYLESHEETS_SRC, { base: '.' })
      // Some of the vendor styles contain CSS comments that
      // break 'rework'. We remove them here.
      // See https://github.com/reworkcss/css/issues/24
      .pipe(
        mapFileContents(function(contents) {
          return contents.replace(CSS_COMMENT_RE, '');
        })
      )
      .pipe(sourceMaps.init())
      .pipe(concat('vendor.css'))
      .pipe(sourceMaps.write({ sourceRoot: '/' }))
      .pipe(gulp.dest('./public/app'))
  );
}

function processAppStylesheets() {
  // Use `base: '.'` for correct source map paths
  return gulp
    .src('./src/stylesheets/legacy-styles.css', { base: '.' })
    .pipe(sourceMaps.init())
    .pipe(concat('main.css'))
    .pipe(sourceMaps.write({ sourceRoot: '/' }))
    .pipe(gulp.dest('./public/app'));
}

const processStylesheets = gulp.parallel(processVendorStylesheets, processAppStylesheets);

module.exports = {
  processAppStylesheets,
  processStylesheets
};
