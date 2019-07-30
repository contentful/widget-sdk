const gulp = require('gulp');
const copySvg = require('./svg');

function copyStatics() {
  return gulp.src(['vendor/font-awesome/*.+(eot|svg|ttf|woff)']).pipe(gulp.dest('./public/app'));
}

function copyImages() {
  return gulp.src(['src/images/**/*']).pipe(gulp.dest('./public/app/images'));
}

module.exports = gulp.parallel(copySvg, copyImages, copyStatics);
