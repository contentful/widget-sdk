import * as P from 'path'
import {denodeify} from 'promise'
import {watch} from 'chokidar'
import {debounce, values} from 'lodash'
import anymatch from 'anymatch'
import express from 'express'
import runSequence from 'run-sequence'
import {readJSON} from './utils'

import * as IndexPage from './index-page'

const runSequenceP = denodeify(runSequence)

export function serveWatch (patternTaskMap) {
  const buildList = createPromiseList()
  let watcher
  if (!process.env.NO_WATCHING) {
    watcher = watch([], {
      usePolling: true,
      ignoreInitial: true,
      ignored: '**/.*'
    })
  }

  patternTaskMap.forEach(function ([pattern, tasks]) {
    const match = anymatch(pattern)

    const addBuild = buildList.getSlot()
    const build = debounce(buildImmediately, 100)
    build()

    if (watcher) {
      watcher.add(pattern)
      .on('add', buildPath)
      .on('change', buildPath)
      .on('unlink', buildPath)
    }

    function buildImmediately () {
      addBuild(runSequenceP.apply(null, tasks))
    }

    function buildPath (path) {
      if (match(path)) {
        build()
      }
    }
  })

  createServer(buildList.resolve)
}


function createServer (getBuilds) {
  const publicDir = P.resolve(P.resolve('public'))
  const docIndex = sendIndex(P.join(publicDir, 'docs'))

  const app = express()
  app.use(express.static(publicDir))
  app.use('/docs/', docIndex)
  app.get('*', function (req, res, next) {
    if (!req.accepts('html')) {
      next()
      return
    }

    getBuilds().then(function () {
      return readJSON('config/development.json')
      .then(function (config) {
        const index = IndexPage.renderDev(config)
        res.status(200)
        .type('html')
        .end(index)
      })
    }, function (err) {
      res
      .status(500)
      .type('text')
      .send(err.message + '\n' + err.err.message)
      .end()
    })
  })
  app.use(function (_req, res) {
    res.sendStatus(404).end()
  })
  app.listen(3001)
}


/**
 * Create a middleware that serves *all* GET requests that accept HTML
 * with `dir/index.html`.
 */
function sendIndex (dir) {
  return function (req, res, next) {
    if (req.method === 'GET' && req.accepts('html')) {
      res.sendFile(P.join(dir, 'index.html'))
    } else {
      next()
    }
  }
}


function createPromiseList () {
  let nextId = 0
  const promises = {}
  return {
    getSlot: getSlot,
    resolve: resolve
  }

  function getSlot () {
    const id = nextId++
    return function (promise) {
      promises[id] = promise
    }
  }

  function resolve () {
    return Promise.all(values(promises))
  }
}
