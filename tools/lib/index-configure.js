#!/usr/bin/env node

const P = require('path');
const B = require('bluebird');
const URL = require('url');
const {mapValues} = require('lodash');
const U = require('./utils');
const {render: renderIndexPage} = require('./index-page');
const {validate: validateConfig} = require('./config-validator');

const FS = B.promisifyAll(require('fs'));


const MANIFEST_PATHS = [
  'build/static-manifest.json',
  'build/styles-manifest.json',
  'build/app-manifest.json'
];

module.exports.MANIFEST_PATHS = MANIFEST_PATHS;


/**
 * @usage
 * import configure from '.../index-configure'
 * yield* configure(sha, configPath, outPath)
 *
 * @description
 * Reads configuration and manifest files and creates a configured
 * `index.html` file.
 *
 * The configuration data is validated against the schema defined in
 * `./config-schema.js`.
 *
 * Loads the manifest to resolve URLs from `MANIFEST_PATHS`.
 *
 * Returns the name of the environment.That is the value of the
 * `environment` configufation key.
 *
 * @param {string} revision
 * @param {string} configPath
 * @param {string} outPath
 *   Path to write the index file to.
 * @return {string}
 */

module.exports = function* configure (revision, configPath, outPath) {
  const [manifest, config] = yield B.all([
    U.readMergeJSON(MANIFEST_PATHS),
    U.readJSON(configPath)
  ]);

  console.log(`Creating compiled index for "${config.environment}" at ${P.relative('', outPath)}`);

  validateConfig(config);

  const manifestResolved = mapValues(manifest, (path) => URL.resolve(config.assetUrl, path));
  const indexPage = renderIndexPage(revision, config, manifestResolved);
  yield U.mkdirp(P.dirname(outPath));
  yield FS.writeFileAsync(outPath, indexPage, 'utf8');
  return config.environment;
};
