#!/usr/bin/env babel-node

import * as B from 'bluebird'
import * as P from 'path'
import * as TravisEnv from '../lib/travis-env'
import {mkdirp, FS} from '../lib/utils'

/**
 * @usage
 * ./create-file-dist.js build upload
 *
 * @description
 * Creates a file distribution of a build depending on the Travis build
 * settings
 *
 * Run `gulp/build` to prepare the build files in the `build`
 * directory.
 *
 * Copies the following files.
 * ~~~
 * build/app -> upload/app
 * build/index.html -> upload/archive/$TRAVIS_COMMIT/index-compiled.html
 * ~~~
 *
 * If the build is not a pull request it also prepares an index for
 * the built branch.
 * ~~~
 * build/index.html -> upload/archive/$TRAVIS_BRANCH/index-compiled.html
 * ~~~
 */

main()

function main () {
  let args = parseArgs(process.argv)
  B.coroutine(createDist)(...args)
  .done()
}

function parseArgs (argv) {
  let [src, dest] = argv.slice(2)
  if (!src || !dest) {
    console.error('You must parse SRC and DEST arguments')
    process.exit(1)
  }
  return [src, dest]
}

function* createDist (src, dest) {
  let travis = TravisEnv.load()
  let revisionArchive = P.join(dest, 'archive')
  yield mkdirp(revisionArchive)
  yield copy(P.join(src, 'app'), P.join(dest, 'app'))
  yield copy(P.join(src, 'styleguide'), P.join(dest, 'styleguide', travis.branch))

  let indexSrc = P.join(src, 'index.html')
  let shaIndex = P.join(revisionArchive, travis.commit, 'index-compiled.html')
  yield copy(indexSrc, shaIndex)

  if (!travis.isPr) {
    let branchIndex = P.join(revisionArchive, travis.branch, 'index-compiled.html')
    yield copy(indexSrc, branchIndex)
  }
}

function copy (src, dest) {
  console.log('%s -> %s', src, dest)
  return FS.copyAsync(src, dest)
}
