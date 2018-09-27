const gulp = require('gulp');
const sourceMaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const rev = require('gulp-rev');
const mergeStream = require('merge-stream');
const { writeFile, changeBase } = require('../helpers');

const uglify = composer(uglifyes, console);

/**
 * Concatenates and minifies application JS files to
 * `application.min.js` and creates a manifest.
 */
gulp.task('build/js', ['js', 'templates'], function() {
  // The main production application
  const prodBundleSteeam = generateBundleFromFiles(
    'app/application.min.js',
    'build/app-manifest.json',
    [
      'public/app/templates.js',
      'public/app/vendor.js',
      'public/app/libs.js',
      'public/app/components.js'
    ]
  );

  // The "test" application, bundled with test dependencies
  const testBundleStream = generateBundleFromFiles(
    'app/test-bundle.min.js',
    'build/test-manifest.json',
    [
      'public/app/templates.js',
      'public/app/vendor.js',
      'public/app/libs-test.js',
      'public/app/components.js'
    ]
  );

  return mergeStream(prodBundleSteeam, testBundleStream);
});

function generateBundleFromFiles(bundlePath, manifestPath, files) {
  return (
    gulp
      .src(files)
      .pipe(sourceMaps.init({ loadMaps: true, largeFile: true }))
      .pipe(concat(bundlePath))
      .pipe(uglify())
      .pipe(changeBase('build'))
      .pipe(rev())
      .pipe(writeFile())
      // 'uglify' already prepends a slash to every source path
      .pipe(sourceMaps.write('.', { sourceRoot: null }))
      .pipe(writeFile())
      .pipe(rev.manifest(manifestPath))
      .pipe(writeFile())
  );
}
