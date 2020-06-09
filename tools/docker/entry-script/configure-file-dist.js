const P = require('path');
const { FS } = require('../../lib/utils');
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
 * main index file that is uploaded as the main `index.html` and thus
 * trigger a deployment.
 *
 * output/files/staging/index.html (served for request to app.flinkly.com)
 */
module.exports = async function configureFileDistribution({ branchName, gitSha }) {
  console.log(`BRANCH: ${branchName}, COMMIT: ${gitSha}`);

  // Supported environments
  const ENV = {
    production: 'production',
    staging: 'staging',
    preview: 'preview',
    development: 'development',
  };

  // Maps branch names to environment names
  const BRANCH_ENV_MAP = {
    master: ENV.production,
  };

  await createFileDist(ENV.development, gitSha, branchName);
  await createFileDist(ENV.preview, gitSha, branchName);
  await createFileDist(ENV.staging, gitSha, branchName);
  await createFileDist(ENV.production, gitSha, branchName);

  // Do the next bit only for production, master and preview branches
  if (branchName in BRANCH_ENV_MAP) {
    const env = BRANCH_ENV_MAP[branchName];

    await createIndex(env, gitSha);

    // Deploy to preview environment whenever we deploy to staging
    // to keep both envs in sync
    if (env === ENV.staging) {
      await createIndex(ENV.preview, gitSha);
    }
  }
};

/**
 * @description
 * This method generates the root index.html file for given environment
 * and user_interface commit hash.
 *
 * @param env {string} env - Target environment. One of production, staging, preview
 * @param gitSha {string} gitSha - Git commit hash of the commit that's being built
 */
async function createIndex(env, gitSha) {
  const rootIndexPathForEnv = targetPath(env, 'index.html');
  const logMsg = `Creating root index file for "${env}"`;

  console.log('-'.repeat(logMsg.length), `\n${logMsg}`);

  // This generates output/files/${env}/index.html
  return configureAndWriteIndex(gitSha, `config/${env}.json`, rootIndexPathForEnv);
}

/*
 * Creates a file distribution after tools/bin/build-app.js.
 *
 * Copies the following files.
 * ~~~
 * build/app        -> output/files/${env}/app
 * build/index.html -> output/files/${env}/archive/${gitSha}/index-compiled.html
 * build/index.html -> output/files/${env}/archive/${branchName}/index-compiled.html
 * ~~~
 *
 * The index.html file is configured with `config/{env}.json`.
 *
 * @param {string} env
 * @param {string} gitSha
 * @param {string} branchName
 */
async function createFileDist(env, gitSha, branchName) {
  console.log(`Creating file distribution for "${env}"`);

  // This directory contains all the files needed to run the app.
  const BUILD_SRC = P.resolve('./public');

  await copy(P.join(BUILD_SRC, 'app'), targetPath(env, 'app'));

  const commitHashIndexPath = targetPath(env, 'archive', gitSha, 'index-compiled.html');
  await configureAndWriteIndex(gitSha, `config/${env}.json`, commitHashIndexPath);

  const branchIndexPath = targetPath(env, 'archive', branchName, 'index-compiled.html');
  await configureAndWriteIndex(gitSha, `config/${env}.json`, branchIndexPath);
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
function targetPath(...components) {
  // Destination directory for files that are uploaded to S3 buckets
  const FILE_DIST_DEST = P.resolve('./output/files');

  return P.join(FILE_DIST_DEST, ...components);
}

function copy(src, dest) {
  console.log('Copying %s -> %s', P.relative('', src), P.relative('', dest));
  return FS.copyAsync(src, dest);
}
