import {transform, camelCase, keys, includes} from 'lodash'

const BRANCH_ENV_MAP = {
  'production': 'production',
  'master': 'staging',
  'preview': 'preview'
}

const MAIN_BRANCHES = keys(BRANCH_ENV_MAP)

/**
 * @description
 * Loads Travis build information from the envrionment variables
 *
 * For each `TRAVIS_XXX` environment variable a property `xxx` is set
 * on the returned object. The property names use camel case.
 *
 * In addition the following properties are available:
 * - `isPr`. True if this builds the merge commit of a pull request.
 * - `targetEnv`. A string identifying the environment that this build
 *   is being deployed to. Either 'production', 'staging`, `preview`,
 *   or `development`.
 * - `isMainBranch`. True if the current build is for a branch that
 *   represents the main state of `targetEnv`.
 *
 * See [Travis environment variables][travis] for more information.
 * [travis]: https://docs.travis-ci.com/user/environment-variables/#Default-Environment-Variables
 */
export function load () {
  let travis = loadEnv(process.env)
  let isPr = travis.pullRequest !== 'false'
  let targetEnv = getTargetEnv(isPr, travis.branch)
  let isMainBranch = includes(MAIN_BRANCHES, travis.branch)
  return Object.assign(travis, {isPr, targetEnv, isMainBranch})
}

function loadEnv (env) {
  return transform(env, (travis, value, key) => {
    let match = key.match(/^TRAVIS_(\w+)$/)
    if (match) {
      travis[camelCase(match[1])] = value
    }
  }, {})
}

function getTargetEnv (isPr, branch) {
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
