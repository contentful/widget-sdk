/**
 * @overview this file contains common helpers for all tasks
 * but does not have any gulp tasks itself
 */

const fs = require('fs');
const S = require('../lib/stream-utils');
const path = require('path');
const stylus = require('gulp-stylus');
const nib = require('nib');
const gulp = require('gulp');
const sourceMaps = require('gulp-sourcemaps');
const _ = require('lodash');

module.exports.assertFilesExist = assertFilesExist;
module.exports.passError = passError;
module.exports.mapFileContents = mapFileContents;
module.exports.changeBase = changeBase;
module.exports.buildStylus = buildStylus;
module.exports.mapSourceMapPaths = mapSourceMapPaths;

module.exports.writeFile = writeFile;
module.exports.removeSourceRoot = removeSourceRoot;

function assertFilesExist (paths) {
  paths.forEach(function (path) {
    const stat = fs.statSync(path);
    if (!stat.isFile()) {
      throw new Error(path + ' is not a file');
    }
  });
  return paths;
}

function passError (target) {
  return function handleError (e) {
    target.emit('error', e);
  };
}

function mapFileContents (fn) {
  return S.map(function (file) {
    let contents = file.contents.toString();
    contents = fn(contents, file);
    // eslint-disable-next-line node/no-deprecated-api
    file.contents = new Buffer(contents, 'utf8');
    return file;
  });
}

function changeBase (base) {
  return S.map(function (file) {
    base = path.resolve(base);
    const filePath = path.join(base, file.relative);
    file.base = base;
    file.path = filePath;
    return file;
  });
}

function buildStylus (sources, dest) {
  assertFilesExist([sources]);
  dest = gulp.dest(dest);
  return gulp.src(sources)
    .pipe(sourceMaps.init())
    .pipe(stylus({
      use: nib(),
      sourcemap: {inline: true}
    }))
    .on('error', passError(dest))
    .pipe(mapSourceMapPaths(function (src) {
      return path.join('src/stylesheets', src);
    }))
    .pipe(sourceMaps.write({sourceRoot: '/'}))
    .pipe(dest);
}

/**
 * Stream transformer that for every file applies a function to all source map paths.
 */
function mapSourceMapPaths (fn) {
  return S.map(function (file) {
    if (file.sourceMap) {
      file.sourceMap.sources = _.map(file.sourceMap.sources, fn);
    }
    return file;
  });
}

function writeFile () {
  return gulp.dest(function (file) {
    return file.base;
  });
}

/**
 * Stream transformer that removes the `sourceRoot` property from a
 * file’s source maps.
 */
function removeSourceRoot () {
  return S.map(function (file) {
    if (file.sourceMap) {
      file.sourceMap.sourceRoot = null;
    }
    return file;
  });
}
