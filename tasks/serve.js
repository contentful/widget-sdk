'use strict';

var Path = require('path');
var Promise = require('promise');
var chokidar = require('chokidar');
var anymatch = require('anymatch');
var express = require('express');
var _ = require('lodash-node/modern');
var runSequence = require('run-sequence');
var runSequenceP = Promise.denodeify(runSequence);

module.exports = function serveWatch (patternTaskMap) {
  var buildList = createPromiseList();
  var watcher;
  if (!process.env.NO_WATCHING) {
    watcher = chokidar.watch([], {
      usePolling: true,
      ignoreInitial: true,
      ignored: '**/.*'
    });
  }

  patternTaskMap.forEach(function (item) {
    var pattern = item[0];
    var match = anymatch(pattern);
    var tasks = item[1];

    var addBuild = buildList.getSlot();
    var build = _.debounce(buildImmediately, 100);
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

  createServer(buildList.resolve);
};


function createServer (getBuilds) {
  var publicDir = Path.resolve(Path.resolve('public'));
  var docIndex = sendIndex(Path.join(publicDir, 'docs'));
  var appIndex = sendIndex(publicDir);

  var app = express();
  app.use(express.static(publicDir));
  app.use('/docs/', docIndex);
  app.get('*', function (req, res, next) {
    getBuilds().then(function () {
      appIndex(req, res, next);
    }, function (err) {
      res
      .status(500)
      .type('text')
      .send(err.message + '\n' + err.err.message)
      .end();
    });
  });
  app.use(respond404);
  app.listen(3001);
}


/**
 * Create a middleware that serves *all* GET requests that accept HTML
 * with `dir/index.html`.
 */
function sendIndex (dir) {
  return function (req, res, next) {
    if (req.method === 'GET' && req.accepts('html')) {
      res.sendFile(Path.join(dir, 'index.html'));
    } else {
      next();
    }
  };
}

function respond404 (req, res) {
  res.sendStatus(404);
}


function createPromiseList () {
  var nextId = 0;
  var promises = {};
  return {
    getSlot: getSlot,
    resolve: resolve
  };

  function getSlot () {
    var id = nextId++;
    return function (promise) {
      promises[id] = promise;
    };
  }

  function resolve () {
    return Promise.all(_.values(promises));
  }
}
