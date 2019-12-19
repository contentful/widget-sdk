const serveWithWatcher = require('../lib/server').serveWatch;

function serve() {
  const configName = process.env.UI_CONFIG || 'development';
  const watchFiles = !process.env.NO_WATCHING;

  return serveWithWatcher(configName, watchFiles, []);
}
module.exports = serve;
