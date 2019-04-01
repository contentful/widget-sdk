const gulp = require('gulp');
const clean = require('gulp-clean');

gulp.task('clean', function() {
  return gulp.src(['./public/app', './build/*'], { read: false, allowEmpty: true }).pipe(clean());
});
