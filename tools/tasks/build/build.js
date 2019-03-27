const gulp = require('gulp');

/**
 * Production Builds
 * =================
 *
 * This task creates the production build in the `build` directory.
 *
 * TODO rewrite
 * It uses the files created by the `all` tasks in `public/app`.
 * The `rev-static`, `rev-dynamic` and `rev-app` tasks fingerprint
 * these files and create manfests for them. The `rev-index` task then
 * inserts the fingerprinted links into the `index.html`
 *
 * Fingerprinting
 * --------------
 *
 * We use `gulp-rev` for fingerprinting assets. This works as follows.
 *
 * - `rev()` is a transformer that calculates a checksum and renames
 *   every file by appending the checksum to its name.
 *
 * - `rev.manifest()` is a transformer that creates a json file that
 *   maps each non-fingerprinted file to its fingerprinted version.
 */
gulp.task(
  'build',
  gulp.series(
    'clean',
    gulp.parallel(
      gulp.series('js', 'templates', gulp.parallel('build/js', 'build/chunks')),
      'build/styles'
    )
  )
);

gulp.task(
  'build-test-ci',
  gulp.series(
    'clean',
    gulp.parallel(
      gulp.series('js', 'templates', gulp.parallel('build/js/test', 'build/chunks')),
      'build/styles'
    )
  )
);

gulp.task(
  'build-app-ci',
  gulp.series(
    'clean',
    gulp.parallel(
      gulp.series('js', 'templates', gulp.parallel('build/js/app', 'build/chunks')),
      'build/styles'
    )
  )
);
