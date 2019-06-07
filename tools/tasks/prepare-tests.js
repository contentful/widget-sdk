const gulp = require('gulp');
const js = require('./js');
const { processJadeTemplates } = require('./templates');

/**
 * Build all files necessary to run the tests
 */
module.exports = gulp.parallel(js, processJadeTemplates);
// gulp.task('prepare-tests', gulp.parallel(js, processJadeTemplates));
