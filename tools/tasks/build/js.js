const gulp = require('gulp');
const sourceMaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const terser = require('terser');
const sort = require('gulp-sort');
const composer = require('gulp-uglify/composer');
const rev = require('gulp-rev');
const { writeFile, changeBase } = require('../helpers');

const uglify = composer(terser, console);

/**
 * Concatenates and minifies application JS files to
 * `application.min.js` and creates a manifest.
 */
function bundleAppJs() {
  // The main production application
  const prodBundleSteeam = generateBundleFromFiles({
    bundlePath: 'app/application.min.js',
    manifestPath: 'build/app-manifest.json',
    files: ['public/app/templates.js', 'public/app/app.js']
  });

  return prodBundleSteeam;
}

/**
 * Concatenates and minifies application JS files to
 * `application.min.js` and creates a manifest.
 */
function bundleTestJs() {
  // The "test" application, bundled with test dependencies
  const testBundleStream = generateBundleFromFiles({
    files: ['public/app/templates.js', 'public/app/dependencies.js'],
    isTestBuild: true
  });

  return testBundleStream;
}

function generateBundleFromFiles({ bundlePath, manifestPath, files, isTestBuild = false }) {
  if (isTestBuild) {
    return gulp
      .src(files)
      .pipe(sourceMaps.init({ loadMaps: true }))
      .pipe(changeBase('build'))
      .pipe(sourceMaps.write('.', { sourceRoot: '/' }))
      .pipe(writeFile());
  }

  return (
    gulp
      .src(files)
      .pipe(sourceMaps.init({ loadMaps: true }))
      .pipe(concat(bundlePath))
      // Since the order of streams are not guaranteed, some plugins such as gulp-concat can cause the final file's content and hash to change.
      // To avoid generating a new hash for unchanged source files
      .pipe(sort())
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

module.exports = {
  bundleAppJs,
  bundleTestJs
};
