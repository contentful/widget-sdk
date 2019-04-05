const gulp = require('gulp');
const sourceMaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const terser = require('terser');
const composer = require('gulp-uglify/composer');
const rev = require('gulp-rev');
const { writeFile, changeBase } = require('../helpers');

const uglify = composer(terser, console);

/**
 * Concatenates and minifies application JS files to
 * `application.min.js` and creates a manifest.
 */
gulp.task('build/js/app', () => {
  // The main production application
  const prodBundleSteeam = generateBundleFromFiles({
    bundlePath: 'app/application.min.js',
    manifestPath: 'build/app-manifest.json',
    files: [
      'public/app/templates.js',
      'public/app/vendor.js',
      'public/app/libs.js',
      'public/app/components.js'
    ]
  });

  return prodBundleSteeam;
});

/**
 * Concatenates and minifies application JS files to
 * `application.min.js` and creates a manifest.
 */
gulp.task('build/js/test', () => {
  // The "test" application, bundled with test dependencies
  const testBundleStream = generateBundleFromFiles({
    bundlePath: 'app/test-bundle.min.js',
    manifestPath: 'build/test-manifest.json',
    files: [
      'public/app/templates.js',
      'public/app/vendor.js',
      'public/app/libs-test.js',
      'public/app/components.js'
    ],
    isTestBuild: true
  });

  return testBundleStream;
});

function generateBundleFromFiles({ bundlePath, manifestPath, files, isTestBuild = false }) {
  if (isTestBuild) {
    return gulp
      .src(files)
      .pipe(sourceMaps.init({ loadMaps: true }))
      .pipe(concat(bundlePath))
      .pipe(changeBase('build'))
      .pipe(sourceMaps.write('.', { sourceRoot: '/' }))
      .pipe(writeFile());
  }

  return (
    gulp
      .src(files)
      .pipe(sourceMaps.init({ loadMaps: true }))
      .pipe(concat(bundlePath))
      .pipe(uglify())
      .pipe(changeBase('build'))
      .pipe(rev())
      .pipe(writeFile())
      // 'uglify' already prepends a slash to every source path
      .pipe(sourceMaps.write('.', { sourceRoot: '' }))
      .pipe(writeFile())
      .pipe(rev.manifest(manifestPath))
      .pipe(writeFile())
  );
}
