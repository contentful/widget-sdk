const gulp = require('gulp');
const copyStatic = require('./copy');
const { processStylesheets } = require('./stylesheets');

module.exports = gulp.parallel(copyStatic, processStylesheets);
