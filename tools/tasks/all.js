const gulp = require('gulp');
const runSequence = require('run-sequence');

gulp.task('all', function (done) {
  runSequence(
    ['templates', 'js', 'copy-images', 'copy-static', 'stylesheets'],
    'styleguide',
    done
  );
});
