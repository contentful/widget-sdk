const gulp = require('gulp');

gulp.task('all', gulp.series('templates', 'copy-images', 'copy-static', 'stylesheets'));
