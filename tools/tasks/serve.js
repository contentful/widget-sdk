const serveWithWatcher = require('../lib/server').serveWatch;
const { processAppStylesheets } = require('./stylesheets');

const STYLESHEETS_SRC = 'src/stylesheets/**/*';

function serve() {
  const configName = process.env.UI_CONFIG || 'development';
  const watchFiles = !process.env.NO_WATCHING;

  const patternTaskMap = [[STYLESHEETS_SRC, [processAppStylesheets]]];

  return serveWithWatcher(configName, watchFiles, patternTaskMap);
}
module.exports = serve;
