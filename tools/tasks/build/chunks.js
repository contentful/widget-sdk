const gulp = require('gulp');
const terser = require('terser');
const composer = require('gulp-uglify/composer');
const { writeFile, changeBase } = require('../helpers');

const uglify = composer(terser, console);

gulp.task('build/chunks', [], function() {
  return gulp
    .src('public/app/chunk_*.js')
    .pipe(uglify())
    .pipe(changeBase('build/app'))
    .pipe(writeFile());
});
