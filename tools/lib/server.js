const P = require('path');
const gulp = require('gulp');

const { watch } = require('chokidar');
const { debounce, values } = require('lodash');
const anymatch = require('anymatch');
const express = require('express');

const { readJSON } = require('./utils');
const middleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const createWebpackConfig = require('../webpack.config');

const IndexPage = require('./index-page');

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
module.exports.serveWatch = function serveWatch(configName, watchFiles, patternTasks) {
  const buildList = createPromiseList();
  let watcher;
  if (watchFiles) {
    watcher = watch([], {
      usePolling: true,
      ignoreInitial: true,
      ignored: '**/.*'
    });
  }

  patternTasks.forEach(function([pattern, tasks]) {
    const match = anymatch(pattern);

    const addBuild = buildList.getSlot();
    const build = debounce(buildImmediately, 100);
    build();

    if (watcher) {
      watcher
        .add(pattern)
        .on('add', buildPath)
        .on('change', buildPath)
        .on('unlink', buildPath);
    }

    const tasksPromise = new Promise((res, rej) => {
      gulp.series(...tasks)(function callbackForAsyncTasks(err) {
        if (err) {
          rej();
        } else {
          res();
        }
      });
    });
    function buildImmediately() {
      addBuild(tasksPromise);
    }

    function buildPath(path) {
      if (match(path)) {
        build();
      }
    }
  });

  return createServer(configName, buildList.resolve);
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
function createServer(configName, getBuild) {
  return new Promise((resolve, reject) => {
    const publicDir = P.resolve(P.resolve('public'));
    const docIndex = sendIndex(P.join(publicDir, 'docs'));

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
      }
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
    app.use('/docs/', docIndex);
    app.get('*', function(req, res, next) {
      if (!req.accepts('html')) {
        next();
        return;
      }

      getBuild().then(
        function() {
          return readJSON(`config/${configName}.json`).then(function(config) {
            const index = IndexPage.renderDev(config);
            res
              .status(200)
              .type('html')
              .end(index);
          });
        },
        function(err) {
          res
            .status(500)
            .type('text')
            .send(err.message + '\n' + err.err.message)
            .end();
        }
      );
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

/**
 * Create a middleware that serves *all* GET requests that accept HTML
 * with `dir/index.html`.
 */
function sendIndex(dir) {
  return function(req, res, next) {
    if (req.method === 'GET' && req.accepts('html')) {
      res.sendFile(P.join(dir, 'index.html'));
    } else {
      next();
    }
  };
}

/**
 * Create an object which allows one to register work at a given slot and
 * request a promise that resolves when all the work is done.
 *
 * ~~~js
 * const set = createPromiseSet()
 * const setSlotA = set.getSlot()
 * const setSlotA = set.getSlot()
 * setSlotA(promiseA)
 * setSlotB(promiseB)
 * setSlotA(promiseA2)
 * resolve().then(() => {
 *   Resolves when 'promiseB' and 'promiseA2' resolve.
 * })
 */
function createPromiseList() {
  let nextId = 0;
  const promises = {};
  return {
    getSlot: getSlot,
    resolve: resolve
  };

  function getSlot() {
    const id = nextId++;
    return function(promise) {
      promises[id] = promise;
    };
  }

  function resolve() {
    return Promise.all(values(promises));
  }
}
