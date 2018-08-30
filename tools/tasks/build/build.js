const gulp = require('gulp');
const runSequence = require('run-sequence');
const path = require('path');

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
gulp.task('build', function(done) {
  runSequence('clean', ['build/js', 'build/styles', 'build/static'], 'build/chunks', done);
});

gulp.task('build/with-styleguide', function(done) {
  runSequence('build', 'styleguide', 'build/copy-styleguide', done);
});

gulp.task('build/copy-styleguide', function() {
  return gulp.src('public/styleguide/**/*').pipe(writeBuild('styleguide'));
});

function writeBuild(dir) {
  return gulp.dest(path.join('build', dir || ''));
}
