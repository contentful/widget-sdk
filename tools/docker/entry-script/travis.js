import * as P from 'path';
import {FS, writeJSON} from '../../lib/utils';
import configureAndWriteIndex from '../../lib/index-configure';

/**
 * For each target environment create a file distribution in `output/files/${env}`.
 *
 * Example:
 * --------
 *
 * For branch as production and pr as false and some commit hash the following files are created:
 *
 * output/files/production/index.html (served for request to app.contentful.com)
 * output/files/production/revision.json (requested by app.contentful.com)
 * output/files/production/app/<fingerprinted assets from all builds> (contains all assets served by static.contentful.com)
 * output/files/producton/archive/<commit-hash or branchname>/index-compiled.html (powers ui_version)
 *
 */
export default function* runTravis ({branch, pr, version}) {
  console.log(`TRAVIS_BRANCH: ${branch}, TRAVIS_COMMIT: ${version}, TRAVIS_PULL_REQUEST: ${pr}`);

  // Supported environments
  const ENV = {
    production: 'production',
    staging: 'staging',
    preview: 'preview',
    development: 'development'
  };

  // Maps branch names to environment names
  const BRANCH_ENV_MAP = {
    production: ENV.production,
    master: ENV.staging,
    preview: ENV.preview
  };

  /**
   * If pr is 'false, it's the travis-ci/push job. Since only this job does the deploy
   * we build and move assets to the right locations for it.
   *
   * Otherwise it's a travis-ci/pr job (PR build), don't even bother building/moving
   * assets since deploy hooks are not called for this job.
   *
   * Doc: https://docs.travis-ci.com/user/deployment/#Pull-Requests
   *
   * NOTE: .travis.yml tells you what disk location is uploaded to which S3 bucket in its
   * deploy section.
   */
  if (pr === 'false') {
    yield* createFileDist(ENV.preview, version, branch, true);
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
  } else {
    console.log('Skipping index compilation and moving of assets as this is a travis-ci/pr job');
  }
}

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
  // This generates output/files/${env}/revision.json
  yield* buildAndWriteRevisionJson(version, revisionPathForEnv);
}

/*
 * Creates a file distribution after gulp build.
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
  console.log(`Creating file distribution for "${env}"`);

  // This directory contains all the files needed to run the app.
  // It is populated by `gulp build`.
  const BUILD_SRC = P.resolve('./build');
  const commitHashIndexPath = targetPath(env, 'archive', version, 'index-compiled.html');

  yield copy(P.join(BUILD_SRC, 'app'), targetPath(env, 'app'));
  yield* configureAndWriteIndex(version, `config/${env}.json`, commitHashIndexPath);

  if (branch) {
    const branchIndexPath = targetPath(env, 'archive', branch, 'index-compiled.html');

    yield* configureAndWriteIndex(version, `config/${env}.json`, branchIndexPath);

    if (includeStyleguide) {
      yield copy(P.join(BUILD_SRC, 'styleguide'), targetPath(env, 'styleguide', branch));
    }
  }
}

/**
 * Build a path relative to FILE_DIST_DEST
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

/**
 * Builds a revision file that is used by user_interface to prompt
 * the user if the version of contentful they are looking at is older
 * that what is live currently.
 *
 * Shape: { "revision": "GIT COMMIT HASH OF THE HEAD OF PRODUCTION BRANCH" }
 */
function* buildAndWriteRevisionJson (version, outPath) {
  yield writeJSON(outPath, {revision: version});
}
