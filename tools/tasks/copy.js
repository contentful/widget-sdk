const gulp = require('gulp');
const copySvg = require('./svg');

function copyStatics() {
  return gulp
    .src([
      'vendor/font-awesome/*.+(eot|svg|ttf|woff)',
      'vendor/fonts.com/*.+(woff|woff2)',
      'node_modules/@contentful/forma-36-react-components/dist/*.+(woff|woff2)'
    ])
    .pipe(gulp.dest('./public/app'));
}

function copyImages() {
  return gulp
    .src(['src/images/**/*', './vendor/jquery-ui/images/*'])
    .pipe(gulp.dest('./public/app/images'));
}

module.exports = gulp.parallel(copySvg, copyImages, copyStatics);
