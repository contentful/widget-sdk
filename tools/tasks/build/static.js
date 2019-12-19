const gulp = require('gulp');
const glob = require('glob');
const rev = require('gulp-rev');

const { changeBase, writeFile } = require('../helpers');
const copyStatic = require('../copy');

function processStatic() {
  const files = glob.sync('public/app/**/*.!(js)');

  return gulp
    .src(files, { base: 'public' })
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/static-manifest.json'))
    .pipe(writeFile());
}

/**
 * Copy all non-JS and non-CSS files from `public/app` to `build` and
 * create a manifest for them.
 */
module.exports = gulp.series(copyStatic, processStatic);
