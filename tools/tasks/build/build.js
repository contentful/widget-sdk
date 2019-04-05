const gulp = require('gulp');

gulp.task(
  'build-test',
  gulp.series(
    'clean',
    gulp.parallel(
      gulp.series(
        gulp.parallel('js', 'templates'),
        gulp.parallel('build/js/test', 'build/chunks/test')
      ),
      'build/styles'
    )
  )
);

gulp.task(
  'build-app',
  gulp.series(
    'clean',
    gulp.parallel(
      gulp.series(gulp.parallel('js', 'templates'), gulp.parallel('build/js/app', 'build/chunks')),
      'build/styles'
    )
  )
);
