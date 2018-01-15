import * as P from 'path'
import * as B from 'bluebird'
import {includes} from 'lodash'

import {writeJSON, FS, exec} from '../../lib/utils'
import configureIndex_ from '../../lib/index-configure'

// Maps branch names to environment names
const BRANCH_ENV_MAP = {
  'production': 'production',
  'master': 'staging',
  'preview': 'preview'
}

// The list of branches that build the current version for the
// different target environments.
const MAIN_BRANCHES = Object.keys(BRANCH_ENV_MAP)

// This directory contains all the files needed to run the app.
// It is populated by `gulp build`.
const BUILD_SRC = P.resolve('./build')


// Destination directory for files that are uploaded to S3 buckets
const FILE_DIST_DEST = P.resolve('./output/files')

// Destination directory for debian packages.
const PKG_DEST = P.resolve('./output/package')


/**
 * Create and configure distribution based on Travis parameters.
 *
 * - For each target environment create a file distribution in
 *   `output/files/{env}`.
 * - Create a debian package in `output/packages` if we build the
 *   'master', 'production', or 'preview' branch.
 */
export default function* runTravis ({branch, pr, version}) {
  const travis = loadTravisEnv(branch, pr)
  yield* createFileDist('preview', version, travis.distBranch, true)
  yield* createFileDist('staging', version, travis.distBranch)
  yield* createFileDist('production', version, travis.distBranch)
  yield* createFileDist('development', version, travis.distBranch)
  if (travis.isMainBranch) {
    const rootIndexPathForEnv = targetPath(travis.targetEnv, 'index.html')
    const revisionPathForEnv = targetPath(travis.targetEnv, 'revision.json')

    yield* configureIndex(version, travis.targetEnv, 'build/index.html')
    yield* createPackageDist(version)

    // new deploy will use these two files and not the package built above
    yield* configureIndex(version, travis.targetEnv, rootIndexPathForEnv)

    console.log(`Creating revision.json for "${travis.targetEnv}" at ${P.relative('', revisionPathForEnv)}`)
    yield* buildAndWriteRevisionJson(version, revisionPathForEnv)
  }
}

function* buildAndWriteRevisionJson (version, outPath) {
  yield writeJSON(outPath, {revision: version})
}


/**
 * Creates information about the build context from Travis environment
 * variables.
 *
 * The returned object has the following properties
 * - isMerge: boolean. True iff we build the merge commit of a branch
 *   against its PR target.
 * - targetEnv: string. The name of the environment we want to deploy
 *   to.  Is 'staging' for master branch builds, 'production' for
 *   production branch builds and 'preview' otherwise.
 * - isMainBranch: boolean.  True iff we build the current version of
 *   one of the target environments.
 * - distBranch: string?  Contains the name of the branch if we are
 *   building a branch head.
 */
function loadTravisEnv (branch, pullRequest) {
  const isMerge = pullRequest !== 'false'
  const distBranch = isMerge ? null : branch
  const targetEnv = getTravisTargetEnv(branch, isMerge)
  const isMainBranch = !isMerge && includes(MAIN_BRANCHES, branch)
  return {
    branch,
    pullRequest,
    isMerge,
    targetEnv,
    isMainBranch,
    distBranch
  }
}

function getTravisTargetEnv (branch, isMerge) {
  if (branch === undefined) {
    return 'development'
  }

  if (isMerge) {
    return 'preview'
  }

  if (branch in BRANCH_ENV_MAP) {
    return BRANCH_ENV_MAP[branch]
  }

  return 'preview'
}


/*
 * Creates a file distribution of a build.
 *
 * Copies the following files.
 * ~~~
 * build/app -> output/files/${env}/app
 * build/index.html -> output/files/${env}/archive/${version}/index-compiled.html
 * ~~~
 *
 * and if `branch` is defined
 * ~~~
 * build/index.html -> dest/files/${env}/archive/${branch}/index-compiled.html
 * build/styleguide -> dest/files/${env}/styleguide/${branch}
 * ~~~
 *
 * The index.html file is configured with `config/{env}.json`.
 *
 * @param {string} env
 * @param {string} version
 * @param {string?} branch
 * @param {boolean?} includeStyleguide
 */
function* createFileDist (env, version, branch, includeStyleguide) {
  console.log(`Creating file distribution for "${env}"`)
  yield copy(P.join(BUILD_SRC, 'app'), targetPath(env, 'app'))

  const commitHashIndex = targetPath(env, 'archive', version, 'index-compiled.html')
  yield* configureIndex(version, env, commitHashIndex)
  if (branch) {
    const branchIndexPath = targetPath(env, 'archive', branch, 'index-compiled.html')
    yield* configureIndex(version, env, branchIndexPath)
    if (includeStyleguide) {
      const styleguidePath = targetPath(env, 'styleguide', branch)
      yield copy(P.join(BUILD_SRC, 'styleguide'), styleguidePath)
    }
  }
}

function targetPath (...components) {
  return P.join(FILE_DIST_DEST, ...components)
}

/*
 * Creates a Debian package from a build.
 *
 * Creates the following files
 * - dest/archive/user_interface/pool/cf-user-interface_0.${date}-g${version}
 * - dest/archive/user_interface/git/${version}
 *
 * The first one is a Debian package that includes the following files
 * and directories
 * - /opt/contentful/cf-user-interface/build/app
 * - /opt/contentful/cf-user-interface/build/index.html
 * - /opt/contentful/cf-user-interface/build/revision.json
 *
 * The second one is a simple text file pointing to the path of the
 * package for this version.
 */
function* createPackageDist (version) {
  console.log(`Creating package distribution in ${PKG_DEST}`)
  const buildRoot = P.resolve('/tmp', 'cf-build')
  const destBuild = P.join(buildRoot, 'build')
  const epochSeconds = Math.floor(Date.now() / 1000)
  const pkgVersion = `0.${epochSeconds}-g${version}`
  const poolDirRelative = P.join('archive', 'user_interface', 'pool')
  const poolDir = P.join(PKG_DEST, poolDirRelative)
  const linkFile = P.join(PKG_DEST, 'archive', 'user_interface', 'git', version)
  yield FS.mkdirsAsync(buildRoot)
  yield FS.mkdirsAsync(poolDir)
  yield FS.mkdirsAsync(P.dirname(linkFile))

  yield copy(BUILD_SRC, destBuild)
  yield* stripCssFingerprints(P.join(destBuild, 'app'))
  yield writeJSON(P.join(destBuild, 'revision.json'), {revision: version})

  yield exec(
    'fpm -t deb -s dir -n cf-user-interface ' +
    '--prefix /opt/contentful/cf-user-interface ' +
    `--version ${pkgVersion} -C ${buildRoot}`,
    {cwd: poolDir}
  )
  const packageFiles = yield FS.readdirAsync(poolDir)
  console.log('Created package', packageFiles[0])
  yield FS.writeFileAsync(linkFile, P.join(poolDirRelative, packageFiles[0]), 'utf8')
}

/**
 * Copies the following files:
 * dir/main-abcdef78.css[.map] -> dir/main.css[.map]
 * dir/vendor-abcdef78.css[.map] -> dir/vendor.css[.map]
 */
function* stripCssFingerprints (dir) {
  const FINGERPRINTED_CSS_REGEXP = /(.+)-.{8}(\.css(?:\.map)?)/
  const files = yield FS.readdirAsync(dir)
  const cssFiles = files.filter((file) => file.match(FINGERPRINTED_CSS_REGEXP))
  return B.map(cssFiles, (cssFile) => {
    const newCssFile = cssFile.replace(FINGERPRINTED_CSS_REGEXP, '$1$2')
    return copy(P.join(dir, cssFile), P.join(dir, newCssFile))
  })
}

function copy (src, dest) {
  console.log('%s -> %s', src, dest)
  return FS.copyAsync(src, dest)
}

function* configureIndex (version, env, dest) {
  console.log(`Creating index for "${env}" at ${P.relative('', dest)}`)
  const configPath = `config/${env}.json`
  yield* configureIndex_(version, configPath, dest)
}
