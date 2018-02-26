const gulp = require('gulp');

/**
 * Build all files necessary to run the tests
 */
gulp.task('prepare-tests', ['js/vendor', 'templates', 'js/external-bundle']);
