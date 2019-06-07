const gulp = require('gulp');
const gulpClean = require('gulp-clean');

// gulp.task('clean')
function clean() {
  return gulp
    .src(['./public/app', './build/*'], { read: false, allowEmpty: true })
    .pipe(gulpClean());
}

module.exports = clean;
