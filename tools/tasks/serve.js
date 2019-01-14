const gulp = require('gulp');
const serve = require('../lib/server').serveWatch;
const { TEMPLATES_SRC } = require('./templates');

const STYLESHEETS_SRC = 'src/stylesheets/**/*';

gulp.task('serve', function() {
  const configName = process.env.UI_CONFIG || 'development';
  const watchFiles = !process.env.NO_WATCHING;

  const patternTaskMap = [[TEMPLATES_SRC, ['templates']], [STYLESHEETS_SRC, ['stylesheets/app']]];

  return serve(configName, watchFiles, patternTaskMap);
});
