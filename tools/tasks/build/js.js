const gulp = require('gulp');
const sourceMaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const rev = require('gulp-rev');
const { writeFile, changeBase } = require('../helpers');

const uglify = composer(uglifyes, console);

/**
 * Concatenates and minifies application JS files to
 * `application.min.js` and creates a manifest.
 */
gulp.task('build/js', ['js', 'templates'], function () {
  return gulp.src([
    'public/app/templates.js',
    'public/app/vendor.js',
    'public/app/libs.js',
    'public/app/components.js'
  ])
    .pipe(sourceMaps.init({ loadMaps: true, largeFile: true }))
    .pipe(concat('app/application.min.js'))
    .pipe(uglify())
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    // 'uglify' already prepends a slash to every source path
    .pipe(sourceMaps.write('.', {sourceRoot: null}))
    .pipe(writeFile())
    .pipe(rev.manifest('build/app-manifest.json'))
    .pipe(writeFile());
});
