/**
 * @overview this file contains common helpers for all tasks
 * but does not have any gulp tasks itself
 */

const fs = require('fs');
const S = require('../lib/stream-utils');
const path = require('path');
const gulp = require('gulp');
const _ = require('lodash');

module.exports.assertFilesExist = assertFilesExist;
module.exports.passError = passError;
module.exports.mapFileContents = mapFileContents;
module.exports.changeBase = changeBase;
module.exports.mapSourceMapPaths = mapSourceMapPaths;

module.exports.writeFile = writeFile;
module.exports.removeSourceRoot = removeSourceRoot;

function assertFilesExist(paths) {
  paths.forEach(function(path) {
    const stat = fs.statSync(path);
    if (!stat.isFile()) {
      throw new Error(path + ' is not a file');
    }
  });
  return paths;
}

function passError(target) {
  return function handleError(e) {
    target.emit('error', e);
  };
}

function mapFileContents(fn) {
  return S.map(function(file) {
    let contents = file.contents.toString();
    contents = fn(contents, file);
    // eslint-disable-next-line node/no-deprecated-api
    file.contents = new Buffer(contents, 'utf8');
    return file;
  });
}

function changeBase(base) {
  return S.map(function(file) {
    base = path.resolve(base);
    const filePath = path.join(base, file.relative);
    file.base = base;
    file.path = filePath;
    return file;
  });
}

/**
 * Stream transformer that for every file applies a function to all source map paths.
 */
function mapSourceMapPaths(fn) {
  return S.map(function(file) {
    if (file.sourceMap) {
      file.sourceMap.sources = _.map(file.sourceMap.sources, fn);
    }
    return file;
  });
}

function writeFile() {
  return gulp.dest(function(file) {
    return file.base;
  });
}

/**
 * Stream transformer that removes the `sourceRoot` property from a
 * file’s source maps.
 */
function removeSourceRoot() {
  return S.map(function(file) {
    if (file.sourceMap) {
      file.sourceMap.sourceRoot = null;
    }
    return file;
  });
}
