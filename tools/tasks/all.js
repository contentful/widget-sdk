const gulp = require('gulp');

gulp.task('all', gulp.parallel('templates', 'copy-images', 'copy-static', 'stylesheets'));
