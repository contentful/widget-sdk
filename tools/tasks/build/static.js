const gulp = require('gulp');
const glob = require('glob');
const { changeBase, writeFile } = require('../helpers');
const rev = require('gulp-rev');

/**
 * Copy all non-JS and non-CSS files from `public/app` to `build` and
 * create a manifest for them.
 */
gulp.task('build/static', [
  'js/external-bundle', 'js/vendor',
  'copy-static', 'copy-images', 'copy-kaltura'
], function () {
  const files = glob.sync('public/app/**/*.!(js|css)');

  return gulp.src(files, {base: 'public'})
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/static-manifest.json'))
    .pipe(writeFile());
});

// Copy Kaltura library to `build`. No fingerprinting.
gulp.task('copy-kaltura', ['js/vendor'], function () {
  return gulp.src(['public/app/kaltura.js'], {base: 'public'})
    .pipe(changeBase('build'))
    .pipe(writeFile());
});
