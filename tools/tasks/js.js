const gulp = require('gulp');
const { build } = require('../webpack-tasks');

gulp.task('js', build);
