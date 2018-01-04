import * as P from 'path'
import {FS, writeJSON} from '../../lib/utils'
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

/**
 * Create and configure distribution based on Travis parameters.
 *
 * - For each target environment create a file distribution in
 *   `output/files/{env}`.
 * - Create a debian package in `output/packages` if we build the
 *   'master', 'production', or 'preview' branch.
 */
export default function* runTravis ({branch, pr, version}) {
  console.log(`TRAVIS_BRANCH: ${branch}, TRAVIS_COMMIT: ${version}, TRAVIS_PULL_REQUEST: ${pr}`)
  const travis = loadTravisEnv(branch, pr)

  /**
   * If it's a travis-ci/pr job (PR build), don't even bother building/moving assets
   * since deploy hooks are not called for this job.
   *
   * Doc: https://docs.travis-ci.com/user/deployment/#Pull-Requests
   */
  if (travis.isPRMergeCommitBuild) {
    console.log('Skipping file creation since this is a PR merge commit build')
    return
  }

  yield* createFileDist('preview', version, travis.distBranch, true)
  yield* createFileDist('staging', version, travis.distBranch)
  yield* createFileDist('production', version, travis.distBranch)
  yield* createFileDist('development', version, travis.distBranch)

  // Do the next bit only for production, master and preview branches
  if (travis.isMainBranch) {
    const rootIndexPathForEnv = targetPath(travis.targetEnv, 'index.html')
    const revisionPathForEnv = targetPath(travis.targetEnv, 'revision.json')
    const logMsg = `Creating root index and revision.json files for "${travis.targetEnv}"`

    console.log('-'.repeat(logMsg.length), `\n${logMsg}`)
    // This generates output/files/${env}/index.html
    yield* configureAndWriteIndex(version, travis.targetEnv, rootIndexPathForEnv)
    // This generates output/files/${env}/revision.json
    yield* buildAndWriteRevisionJson(version, travis.targetEnv, revisionPathForEnv)
  }
}

/**
 * Creates information about the build context from Travis environment
 * variables.
 *
 * The returned object has the following properties:
 *
 * - isPRMergeCommitBuild: boolean. True iff we build the merge commit of
 *   our feature branch being merged into the target branch the PR is opened
 *   against. This is true only for travis-ci/pr builds.
 *
 * - targetEnv: string. The name of the environment we want to deploy
 *   to.  Is 'staging' for master branch builds, 'production' for
 *   production branch builds and 'preview' otherwise.
 *
 * - isMainBranch: boolean.  True iff we build the current version of
 *   one of the target environments.
 *
 * - distBranch: string?  Contains the name of the branch if we are
 *   building a branch head.
 */
function loadTravisEnv (branch, pullRequest) {
  const isPRMergeCommitBuild = pullRequest !== 'false'
  const distBranch = isPRMergeCommitBuild ? null : branch
  const targetEnv = getTravisTargetEnv(branch, isPRMergeCommitBuild)
  const isMainBranch = !isPRMergeCommitBuild && MAIN_BRANCHES.includes(branch)
  return {
    branch,
    pullRequest,
    isPRMergeCommitBuild,
    targetEnv,
    isMainBranch,
    distBranch
  }
}

function getTravisTargetEnv (branch, isPRMergeCommitBuild) {
  if (branch === undefined) {
    return 'development'
  }

  if (isPRMergeCommitBuild) {
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
  // This directory contains all the files needed to run the app.
  // It is populated by `gulp build`.
  const BUILD_SRC = P.resolve('./build')

  console.log(`Creating file distribution for "${env}"`)
  yield copy(P.join(BUILD_SRC, 'app'), targetPath(env, 'app'))

  const commitHashIndexPath = targetPath(env, 'archive', version, 'index-compiled.html')
  yield* configureAndWriteIndex(version, env, commitHashIndexPath)
  if (branch) {
    const branchIndexPath = targetPath(env, 'archive', branch, 'index-compiled.html')
    yield* configureAndWriteIndex(version, env, branchIndexPath)
    if (includeStyleguide) {
      const styleguidePath = targetPath(env, 'styleguide', branch)
      yield copy(P.join(BUILD_SRC, 'styleguide'), styleguidePath)
    }
  }
}

function targetPath (env, ...components) {
  // Destination directory for files that are uploaded to S3 buckets
  const FILE_DIST_DEST = P.resolve('./output/files')

  return P.join(FILE_DIST_DEST, env, ...components)
}

function copy (src, dest) {
  console.log('%s -> %s', src, dest)
  return FS.copyAsync(src, dest)
}

/**
 * Configures index-page.js for the provided commit and environment and writes
 * it to the provided destination path.
 */
function* configureAndWriteIndex (version, env, dest) {
  console.log(`Creating index for "${env}" at ${P.relative('', dest)}`)
  const configPath = `config/${env}.json`
  yield* configureIndex_(version, configPath, dest)
}

/**
 * Builds a revision file that is used by user_interface to prompt
 * the user if the version of contentful they are looking at is older
 * that what is live currently.
 *
 * Shape: { "revision": "GIT COMMIT HASH OF THE HEAD OF PRODUCTION BRANCH" }
 */
function* buildAndWriteRevisionJson (version, env, outPath) {
  console.log(`Creating revision.json for "${env}" at ${P.relative('', outPath)}`)
  yield writeJSON(outPath, {revision: version})
}
