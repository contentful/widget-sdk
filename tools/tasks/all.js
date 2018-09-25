const gulp = require('gulp');
const runSequence = require('run-sequence');

gulp.task('all', function(done) {
  runSequence(['templates', 'copy-images', 'copy-static', 'stylesheets'], done);
});
