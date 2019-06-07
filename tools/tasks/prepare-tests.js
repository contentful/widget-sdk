const gulp = require('gulp');
const js = require('./js');
const { processJadeTemplates } = require('./templates');

/**
 * Build all files necessary to run the tests
 */
module.exports = gulp.parallel(js, processJadeTemplates);
