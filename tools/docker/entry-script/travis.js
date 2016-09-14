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
const PKG_DEST = P.resolve('./output/files')

// The name prefix for branches that should have tagged deploys to
// staging and production.
// Make sure to sync this with the Travis deploy configuration.
const PUBLIC_PREVIEW_PREFIX = 'public-preview/'


/**
 * Create and configure distribution based on Travis parameters.
 *
 * - Determines the configuration from the branch and wheter it is pull
 *   request or not.
 * - Create a file distribution in `output/files` with a version and
 *   branch link to upload to the preview and environment.
 * - Create a debian package in `output/packages` if we build the
 *   'master', 'production', or 'preview' branch.
 */
export default function* runTravis ({branch, pr, version}) {
  let travis = loadTravisEnv(branch, pr)
  yield* createFileDist('preview', version, travis.distBranch, true)
  if (travis.publicPreview) {
    console.log('Generating public preview distribution')
    yield* createFileDist('staging', version, travis.distBranch)
    yield* createFileDist('production', version, travis.distBranch)
  }
  if (travis.isMainBranch) {
    yield* configureIndex(version, travis.targetEnv, 'build/index.html')
    yield* createPackageDist('output/package', version)
  }
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
 * - publicPreview: boolean  True iff we the branch starts with
 *   'public-preview/'. We will then build file distributions for
 *   staging and proudction.
 */
function loadTravisEnv (branch, pullRequest) {
  let isMerge = pullRequest !== 'false'
  let distBranch = isMerge ? null : branch
  let targetEnv = getTravisTargetEnv(branch, isMerge)
  let isMainBranch = !isMerge && includes(MAIN_BRANCHES, branch)
  let publicPreview = distBranch && distBranch.startsWith(PUBLIC_PREVIEW_PREFIX)
  return {
    branch, pullRequest, isMerge, targetEnv,
    isMainBranch, distBranch, publicPreview
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
 * build/index.html -> ouptut/files/${env}/archive/${version}/index-compiled.html
 * ~~~
 *
 * and if `branch` is defined
 * ~~~
 * build/index.html -> dest/files/${env}/archive/${branch}/index-compiled.html
 * build/styleguide -> dest/files/${env}/styleguide/${branch}
 * ~~~
 *
 * @param {string} dest
 * @param {string} version
 * @param {string?} branch
 * @param {boolean?} includeStyleguide
 */
function* createFileDist (env, version, branch, includeStyleguide) {
  console.log(`Creating file distribution for "${env}"`)
  yield copy(P.join(BUILD_SRC, 'app'), targetPath('app'))

  let commitHashIndex = targetPath('archive', version, 'index-compiled.html')
  yield* configureIndex(version, env, commitHashIndex)
  if (branch) {
    let branchIndexPath = targetPath('archive', branch, 'index-compiled.html')
    yield* configureIndex(version, env, branchIndexPath)
    if (includeStyleguide) {
      let styleguidePath = targetPath('styleguide', branch)
      yield copy(P.join(BUILD_SRC, 'styleguide'), styleguidePath)
    }
  }

  function targetPath (...components) {
    return P.join(FILE_DIST_DEST, env, ...components)
  }
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
  let buildRoot = P.resolve('/tmp', 'cf-build')
  const destBuild = P.join(buildRoot, 'build')
  let epochSeconds = Math.floor(Date.now() / 1000)
  let pkgVersion = `0.${epochSeconds}-g${version}`
  let poolDirRelative = P.join('archive', 'user_interface', 'pool')
  let poolDir = P.join(PKG_DEST, poolDirRelative)
  let linkFile = P.join(PKG_DEST, 'archive', 'user_interface', 'git', version)
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
  let packageFiles = yield FS.readdirAsync(poolDir)
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
  console.log('%s -> %s', P.relative('', src), P.relative('', dest))
  return FS.copyAsync(src, dest)
}

function* configureIndex (version, env, dest) {
  console.log(`Creating index for "${env}" at ${P.relative('', dest)}`)
  let configPath = `config/${env}.json`
  yield* configureIndex_(version, configPath, dest)
}
