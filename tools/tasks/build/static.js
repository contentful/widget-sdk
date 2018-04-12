const gulp = require('gulp');
const glob = require('glob');
const { changeBase, writeFile } = require('../helpers');
const rev = require('gulp-rev');

/**
 * Copy all non-JS and non-CS files from `public/app` to `build` and
 * create a manifest for them.
 */
gulp.task('build/static', [
  'js/external-bundle', 'js/vendor',
  'copy-static', 'copy-images'
], function () {
  const files = glob.sync('public/app/**/*.!(js|css)');
  files.push('public/app/kaltura.js');

  return gulp.src(files, {base: 'public'})
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/static-manifest.json'))
    .pipe(writeFile());
});
