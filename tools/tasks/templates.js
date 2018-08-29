const gulp = require('gulp');
const jade = require('gulp-jade');
const jstConcat = require('../../tasks/build-template');
const { passError } = require('./helpers');

const TEMPLATES_SRC = 'src/javascripts/**/*.jade';

module.exports.TEMPLATES_SRC = TEMPLATES_SRC;

gulp.task('templates', function() {
  const dest = gulp.dest('./public/app');
  return gulp
    .src(TEMPLATES_SRC)
    .pipe(jade({ doctype: 'html' }))
    .on('error', passError(dest))
    .pipe(
      jstConcat('templates.js', {
        renameKeys: ['^.*/(.*?).html$', '$1']
      })
    )
    .pipe(dest);
});
