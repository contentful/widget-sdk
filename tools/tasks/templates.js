const gulp = require('gulp');
const jade = require('gulp-jade');
const jstConcat = require('./build-template');
const { passError } = require('./helpers');

const TEMPLATES_SRC = 'src/javascripts/**/*.jade';

function processJadeTemplates() {
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
}

module.exports = {
  TEMPLATES_SRC,
  processJadeTemplates
};
