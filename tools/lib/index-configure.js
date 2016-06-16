#!/usr/bin/env babel-node

import * as P from 'path'
import * as B from 'bluebird'
import * as URL from 'url'
import {mapValues} from 'lodash'
import * as U from './utils'
import {render as renderIndexPage} from './index-page'
import {validate as validateConfig} from './config-validator'

let FS = B.promisifyAll(require('fs'))


/**
 * @usage
 * import configure from '.../index-configure'
 * configure(sha, configPath, manifestPaths, outPath)
 * .then(...)
 *
 * @description
 * Reads configuration and manifest files and creates a configured
 * `index.html` file.
 *
 * The configuration data is validated against the schema defined in
 * `./config-schema.js`.
 *
 * @param {string} revision
 * @param {string} configPath
 * @param {string[]} manifestPaths
 * @param {string} outPath
 * Path to write the index file to.
 */
export default B.coroutine(configure)

function* configure (revision, configPath, manifestPaths, outPath) {
  let [manifest, config] = yield B.all([
    U.readMergeJSON(manifestPaths),
    U.readJSON(configPath)
  ])

  validateConfig(config)

  manifest = mapValues(manifest, (path) => URL.resolve(`//${config.asset_host}`, path))
  let indexPage = renderIndexPage(revision, config, manifest)
  yield U.mkdirp(P.dirname(outPath))
  yield FS.writeFileAsync(outPath, indexPage, 'utf8')
}
