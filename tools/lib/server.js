const P = require('path');
const {denodeify} = require('promise');
const {watch} = require('chokidar');
const {debounce, values} = require('lodash');
const anymatch = require('anymatch');
const express = require('express');
const runSequence = require('run-sequence');
const {readJSON} = require('./utils');

const IndexPage = require('./index-page');

const runSequenceP = denodeify(runSequence);

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
module.exports.serveWatch = function serveWatch (configName, watchFiles, patternTasks) {
  const buildList = createPromiseList();
  let watcher;
  if (watchFiles) {
    watcher = watch([], {
      usePolling: true,
      ignoreInitial: true,
      ignored: '**/.*'
    });
  }

  patternTasks.forEach(function ([pattern, tasks]) {
    const match = anymatch(pattern);

    const addBuild = buildList.getSlot();
    const build = debounce(buildImmediately, 100);
    build();

    if (watcher) {
      watcher.add(pattern)
      .on('add', buildPath)
      .on('change', buildPath)
      .on('unlink', buildPath);
    }

    function buildImmediately () {
      addBuild(runSequenceP.apply(null, tasks));
    }

    function buildPath (path) {
      if (match(path)) {
        build();
      }
    }
  });

  createServer(configName, buildList.resolve);
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
function createServer (configName, getBuild) {
  const publicDir = P.resolve(P.resolve('public'));
  const docIndex = sendIndex(P.join(publicDir, 'docs'));

  const app = express();
  app.use(express.static(publicDir));
  app.use('/docs/', docIndex);
  app.get('*', function (req, res, next) {
    if (!req.accepts('html')) {
      next();
      return;
    }

    getBuild().then(function () {
      return readJSON(`config/${configName}.json`)
      .then(function (config) {
        const index = IndexPage.renderDev(config);
        res.status(200)
        .type('html')
        .end(index);
      });
    }, function (err) {
      res
      .status(500)
      .type('text')
      .send(err.message + '\n' + err.err.message)
      .end();
    });
  });
  app.use(function (_req, res) {
    res.sendStatus(404).end();
  });
  app.listen(3001, (err) => {
    if (err) {
      throw err;
    }

    console.log('Serving application at http://localhost:3001');
  });
}


/**
 * Create a middleware that serves *all* GET requests that accept HTML
 * with `dir/index.html`.
 */
function sendIndex (dir) {
  return function (req, res, next) {
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
function createPromiseList () {
  let nextId = 0;
  const promises = {};
  return {
    getSlot: getSlot,
    resolve: resolve
  };

  function getSlot () {
    const id = nextId++;
    return function (promise) {
      promises[id] = promise;
    };
  }

  function resolve () {
    return Promise.all(values(promises));
  }
}
