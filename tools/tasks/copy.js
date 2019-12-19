const gulp = require('gulp');
const copySvg = require('./svg');

function copyImages() {
  return gulp.src(['src/images/**/*']).pipe(gulp.dest('./public/app/images'));
}

module.exports = gulp.parallel(copySvg, copyImages);
