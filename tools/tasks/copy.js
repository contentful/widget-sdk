const gulp = require('gulp');

const STATIC_SRC = [
  'vendor/font-awesome/*.+(eot|svg|ttf|woff)',
  'vendor/fonts.com/*.+(woff|woff2)',
  'node_modules/@contentful/ui-component-library/dist/*.+(woff|woff2)'
];
const IMAGES_SRC = [
  'src/images/**/*',
  './vendor/jquery-ui/images/*'
];

gulp.task('copy-static', function () {
  return gulp.src(STATIC_SRC)
    .pipe(gulp.dest('./public/app'));
});

gulp.task('copy-images', ['svg'], function () {
  return gulp.src(IMAGES_SRC)
    .pipe(gulp.dest('./public/app/images'));
});
