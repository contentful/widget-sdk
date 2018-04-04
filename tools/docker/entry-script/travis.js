const P = require('path');
const {FS, writeJSON} = require('../../lib/utils');
const configureAndWriteIndex = require('../../lib/index-configure');

/**
 * For each target environment create a file distribution in `output/files/${env}`.
 *
 * For example for the `staging` environment and we create the files
 *
 * output/files/staging/app/<fingerprinted assets from all builds> (contains all assets served by static.flinkly.com)
 * output/files/staging/archive/${version}/index-compiled.html (configured for staging)
 * output/files/staging/archive/${branch}/index-compiled.html (configured for staging)
 *
 * If we build the `production` or the `staging` branch we also create
 * main index and revision files that are uploaded as the main
 * `index.html` and thus trigger a deployment.
 *
 * output/files/staging/index.html (served for request to app.flinkly.com)
 * output/files/staging/revision.json (requested by app.flinkly.com)
 *
 */
module.exports = function* runTravis ({branch, pr, version}) {
  // If `pr` is not 'false' this is the `travis-ci/pr` job. Since we don’t
  // deploy anything for this job we skip the build.
  //
  // See the [Travis documentation][1] for more information about pull
  // request jobs
  //
  // [1] https://docs.travis-ci.com/user/deployment/#Pull-Requests
  if (pr !== 'false') {
    console.log('This is a pull request build. Skipping building distribution');
  }

  // If `pr` is 'false, it's the `travis-ci/push` job. We deploy for
  // this job so we build the app.
  console.log(`TRAVIS_BRANCH: ${branch}, TRAVIS_COMMIT: ${version}`);

  // Supported environments
  const ENV = {
    production: 'production',
    staging: 'staging',
    preview: 'preview'
  };

  // Maps branch names to environment names
  const BRANCH_ENV_MAP = {
    production: ENV.production,
    master: ENV.staging
  };

  yield* createFileDist(ENV.preview, version, branch, { includeStyleguide: true });
  yield* createFileDist(ENV.staging, version, branch);
  yield* createFileDist(ENV.production, version, branch);
  yield* createFileDist(ENV.development, version, branch);

  // Do the next bit only for production, master and preview branches
  if (branch in BRANCH_ENV_MAP) {
    const env = BRANCH_ENV_MAP[branch];

    yield* createIndexAndRevision(env, version);

    // Deploy to preview environment whenever we deploy to staging
    // to keep both envs in sync
    if (env === ENV.staging) {
      yield* createIndexAndRevision(ENV.preview, version);
    }
  }
};

/**
 * @description
 * This method generates the root index.html and revision.json files
 * for given environment and user_interface commit hash (version)
 *
 * @param env {string} env - Target environment. One of production, staging, preview, development
 * @param version {string} version - Git commit hash of the commit that's being built
 */
function* createIndexAndRevision (env, version) {
  const rootIndexPathForEnv = targetPath(env, 'index.html');
  const revisionPathForEnv = targetPath(env, 'revision.json');
  const logMsg = `Creating root index and revision.json files for "${env}"`;

  console.log('-'.repeat(logMsg.length), `\n${logMsg}`);

  // This generates output/files/${env}/index.html
  yield* configureAndWriteIndex(version, `config/${env}.json`, rootIndexPathForEnv);

  console.log(`Creating revision.json for "${env}" at ${P.relative('', revisionPathForEnv)}`);
  // This generates output/files/${env}/revision.json. This file is
  // used by the the user if the version of contentful they are looking
  // at is older that what is live currently.
  yield writeJSON(revisionPathForEnv, { revision: version });
}


/*
 * Creates a file distribution after gulp build.
 *
 * Copies the following files.
 * ~~~
 * build/app        -> output/files/${env}/app
 * build/index.html -> output/files/${env}/archive/${version}/index-compiled.html
 * build/index.html -> output/files/${env}/archive/${branch}/index-compiled.html
 * build/styleguide -> output/files/${env}/styleguide/${branch}
 * ~~~
 *
 * The index.html file is configured with `config/{env}.json`.
 *
 * @param {string} env
 * @param {string} version
 * @param {string} branch
 * @param {boolean} options.includeStyleguide
 */
function* createFileDist (env, version, branch, { includeStyleguide } = {}) {
  console.log(`Creating file distribution for "${env}"`);

  // This directory contains all the files needed to run the app.
  // It is populated by `gulp build`.
  const BUILD_SRC = P.resolve('./build');

  yield copy(P.join(BUILD_SRC, 'app'), targetPath(env, 'app'));

  const commitHashIndexPath = targetPath(env, 'archive', version, 'index-compiled.html');
  yield* configureAndWriteIndex(version, `config/${env}.json`, commitHashIndexPath);

  const branchIndexPath = targetPath(env, 'archive', branch, 'index-compiled.html');
  yield* configureAndWriteIndex(version, `config/${env}.json`, branchIndexPath);

  if (includeStyleguide) {
    yield copy(P.join(BUILD_SRC, 'styleguide'), targetPath(env, 'styleguide', branch));
  }
}

/**
 * Build a path relative to './output/files'.
 *
 * Example:
 * --------
 * targetPath('staging', 'archive', 'COMMIT_HASH', 'index-compiled.html')
 * =>
 * /home/<username>/user_interface/output/files/staging/archive/COMMIT_HASH/index-compiled.html
 */
function targetPath (...components) {
  // Destination directory for files that are uploaded to S3 buckets
  const FILE_DIST_DEST = P.resolve('./output/files');

  return P.join(FILE_DIST_DEST, ...components);
}

function copy (src, dest) {
  console.log('Copying %s -> %s', P.relative('', src), P.relative('', dest));
  return FS.copyAsync(src, dest);
}
