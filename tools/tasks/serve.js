const serveWithWatcher = require('../lib/server').serveWatch;
const { TEMPLATES_SRC, processJadeTemplates } = require('./templates');
const { processAppStylesheets } = require('./stylesheets');

const STYLESHEETS_SRC = 'src/stylesheets/**/*';

function serve() {
  const configName = process.env.UI_CONFIG || 'development';
  const watchFiles = !process.env.NO_WATCHING;

  const patternTaskMap = [
    [TEMPLATES_SRC, [processJadeTemplates]],
    [STYLESHEETS_SRC, [processAppStylesheets]]
  ];

  return serveWithWatcher(configName, watchFiles, patternTaskMap);
}
// gulp.task('serve', serve);

module.exports = serve;
