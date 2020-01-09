const P = require('path');
const express = require('express');

const middleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const createWebpackConfig = require('../webpack.config');
const MicroBackends = require('@contentful/micro-backends');

/**
 * Serve the application and rebuild files on file changes
 *
 * @param {string} configName
 *   Determines which file to read the configuration from by expanding
 *   `config/${configName}.json`.
 * @param {boolean} watchFiles
 *   Determines whether to watch files for changes.
 * @param {[[string, string]]} patternTasks
 *   A list of '[pattern, task]' pairs where 'pattern' is a file pattern and
 *   'task' is the name of a gulp task to be run when any of the files matched
 *   by the pattern changes.
 */
module.exports.serveWatch = function serveWatch() {
  return createServer();
};

/**
 * Create a server to serve the application files.
 *
 * Serves static files from `public` and docs from `public/docs`.
 * All other requests are served with the configured index file.
 *
 * @param {string} configName
 *   Determines which file to read the configuration from by expanding
 *   `config/${configName}.json`.
 * @param {function(): Promise<void>} getBuild
 *   Called whenever the index file is requested. The file is served only after
 *   the returned promise resolves.
 */
function createServer() {
  return new Promise((resolve, reject) => {
    const publicDir = P.resolve(P.resolve('public'));

    const app = express();
    const config = createWebpackConfig();

    const compiler = webpack(config);
    const webpackDevMiddleware = middleware(compiler, {
      publicPath: '/app/',
      watchOptions: {
        aggregateTimeout: 300,
        poll: 1000
      },
      stats: {
        colors: true,
        modules: false,
        providedExports: false,
        usedExports: false
      },
      writeToDisk: filePath => /index\.html/.test(filePath)
    });
    const PORT = Number.parseInt(process.env.PORT, 10) || 3001;

    app.use(
      '/_microbackends',
      MicroBackends.createMiddleware({
        backendsDir: P.resolve(__dirname, '../../micro-backends'),
        isolationType: process.env.MICRO_BACKENDS_ISOLATION_TYPE || 'subprocess'
      })
    );

    app.use(webpackDevMiddleware);

    app.use(express.static(publicDir));
    app.get('*', function(req, res, next) {
      if (!req.accepts('html')) {
        next();
        return;
      }

      res
        .status(200)
        .type('html')
        .sendFile('index.html', { root: P.join(publicDir, 'app') });
    });

    app.use(function(_req, res) {
      res.sendStatus(404).end();
    });

    /**
     * This bit below makes sure that the server starts up only after
     * the first webpack build completes. Since there isn't a "once"
     * version of this method, I have elected to take this approach
     * to prevent app.listen being called after every webpack build.
     */
    let serverStarted = false;
    webpackDevMiddleware.waitUntilValid(() => {
      if (!serverStarted) {
        app.listen(PORT, err => {
          serverStarted = true;
          if (err) {
            reject(err);
          }

          console.log(`Serving application at http://localhost:${PORT}`);
          resolve();
        });
      }
    });
  });
}
