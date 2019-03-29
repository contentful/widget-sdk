const gulp = require('gulp');

const STATIC_SRC = [
  'vendor/font-awesome/*.+(eot|svg|ttf|woff)',
  'vendor/fonts.com/*.+(woff|woff2)',
  'node_modules/@contentful/forma-36-react-components/dist/*.+(woff|woff2)'
];
const IMAGES_SRC = ['src/images/**/*', './vendor/jquery-ui/images/*'];

const copyStatics = () => {
  return gulp.src(STATIC_SRC).pipe(gulp.dest('./public/app'));
};

const copyImages = () => {
  return gulp.src(IMAGES_SRC).pipe(gulp.dest('./public/app/images'));
};

gulp.task('copy-static', gulp.parallel('copy-svg', copyImages, copyStatics));
