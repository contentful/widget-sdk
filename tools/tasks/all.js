const gulp = require('gulp');
const copyStatic = require('./copy');
const { processStylesheets } = require('./stylesheets');
const { processJadeTemplates } = require('./templates');

// gulp.task('all', gulp.parallel(processJadeTemplates, copyStatic, processStylesheets));
module.exports = gulp.parallel(processJadeTemplates, copyStatic, processStylesheets);
