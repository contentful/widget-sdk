const gulp = require('gulp');
const glob = require('glob');
const { changeBase, writeFile } = require('../helpers');
const rev = require('gulp-rev');

const statics = () => {
  const files = glob.sync('public/app/**/*.!(js|css)');

  return gulp
    .src(files, { base: 'public' })
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/static-manifest.json'))
    .pipe(writeFile());
};

/**
 * Copy all non-JS and non-CSS files from `public/app` to `build` and
 * create a manifest for them.
 */
gulp.task('build/static', gulp.series(gulp.parallel('js', 'copy-static', 'copy-images'), statics));
