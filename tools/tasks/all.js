const gulp = require('gulp');
const copyStatic = require('./copy');
const { processStylesheets } = require('./stylesheets');
const { processJadeTemplates } = require('./templates');

module.exports = gulp.parallel(processJadeTemplates, copyStatic, processStylesheets);
