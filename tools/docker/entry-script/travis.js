import * as P from 'path'
import * as B from 'bluebird'
import {includes} from 'lodash'

import {writeJSON, FS, exec} from '../../lib/utils'
import configureIndex from '../../lib/index-configure'

// Maps branch names to environment names
const BRANCH_ENV_MAP = {
  'production': 'production',
  'master': 'staging',
  'preview': 'preview'
}

const MAIN_BRANCHES = Object.keys(BRANCH_ENV_MAP)

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
  let configPath = `config/${travis.targetEnv}.json`
  let env = yield* configureIndex(version, configPath, 'build/index.html')
  console.log(`Configuring index.html for '${env}'`)
  // Do not use PR target branch as distribution branch
  let distBranch = travis.isPr ? null : branch
  yield* createFileDist('build', 'output/files', version, distBranch)
  if (travis.isMainBranch) {
    yield* createPackageDist('build', 'output/package', version)
  }
}


function loadTravisEnv (branch, pullRequest) {
  let isPr = pullRequest !== 'false'
  let targetEnv = getTravisTargetEnv(branch, isPr)
  let isMainBranch = !isPr && includes(MAIN_BRANCHES, branch)
  return {branch, pullRequest, isPr, targetEnv, isMainBranch}
}

function getTravisTargetEnv (branch, isPr) {
  if (branch === undefined) {
    return 'development'
  }

  if (isPr) {
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
 * src/app -> dest/app
 * src/index.html -> dest/archive/${version}/index-compiled.html
 * ~~~
 *
 * and if `branch` is defined
 * ~~~
 * src/index.html -> dest/archive/${branch}/index-compiled.html
 * ~~~
 */
function* createFileDist (src, dest, version, branch) {
  console.log(`Creating file distribution in ${dest}`)
  yield copy(P.join(src, 'app'), P.join(dest, 'app'))
  let indexSrc = P.join(src, 'index.html')

  let commitHashIndex = P.join(dest, 'archive', version, 'index-compiled.html')
  yield copy(indexSrc, commitHashIndex)
  if (branch) {
    let branchIndex = P.join(dest, 'archive', branch, 'index-compiled.html')
    yield copy(indexSrc, branchIndex)
    yield copy(P.join(src, 'styleguide'), P.join(dest, 'styleguide', branch))
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
function* createPackageDist (srcBuild, dest, version) {
  console.log(`Creating package distribution in ${dest}`)
  let buildRoot = P.resolve('/tmp', 'cf-build')
  const destBuild = P.join(buildRoot, 'build')
  let epochSeconds = Math.floor(Date.now() / 1000)
  let pkgVersion = `0.${epochSeconds}-g${version}`
  let poolDirRelative = P.join('archive', 'user_interface', 'pool')
  let poolDir = P.join(dest, poolDirRelative)
  let linkFile = P.join(dest, 'archive', 'user_interface', 'git', version)
  yield FS.mkdirsAsync(buildRoot)
  yield FS.mkdirsAsync(poolDir)
  yield FS.mkdirsAsync(P.dirname(linkFile))

  yield copy(srcBuild, destBuild)
  yield copyAppCss(srcBuild, destBuild)
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
 * src/app/main-abcdef78.css[.map] -> dest/app/main.css[.map]
 * src/app/vendor-abcdef78.css[.map] -> dest/app/vendor.css[.map]
 */
function copyAppCss (src, dest) {
  const FINGERPRINTED_CSS_REGEXP = /(.+)-.{8}(\.css(?:\.map)?)/
  const srcApp = P.join(src, 'app')
  const destApp = P.join(dest, 'app')
  const files = FS.readdirAsync(srcApp)
  const cssFiles = files.filter((file) => file.match(FINGERPRINTED_CSS_REGEXP))
  return B.map(cssFiles, (cssFile) => {
    const newCssFile = cssFile.replace(FINGERPRINTED_CSS_REGEXP, '$1$2')
    return copy(P.join(srcApp, cssFile), P.join(destApp, newCssFile))
  })
}

function copy (src, dest) {
  console.log('%s -> %s', src, dest)
  return FS.copyAsync(src, dest)
}
