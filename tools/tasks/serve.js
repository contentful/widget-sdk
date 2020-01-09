const serveWithWatcher = require('../lib/server').serveWatch;

function serve() {
  return serveWithWatcher();
}
module.exports = serve;
