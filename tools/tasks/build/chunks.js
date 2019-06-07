const gulp = require('gulp');
const terser = require('terser');
const composer = require('gulp-uglify/composer');
const { writeFile, changeBase } = require('../helpers');

const uglify = composer(terser, console);

const CHUNK_SRC = 'public/app/chunk_*.js';
const BUILD_DIR = 'build/app';

function buildMinifiedChunks() {
  return gulp
    .src(CHUNK_SRC)
    .pipe(uglify())
    .pipe(changeBase(BUILD_DIR))
    .pipe(writeFile());
}

/**
 * Unminified chunks are used in test runs
 * Not minifying chunks saves us a lot of time
 * in the build process and therefore we can
 * run the tests faster.
 * And no, non-minification doesn't lead to
 * longer parse times in the browser. We've
 * seen a net reduction in time to run tests
 * since this was introduced.
 */
function buildNonMinifiedChunks() {
  return gulp
    .src(CHUNK_SRC)
    .pipe(changeBase(BUILD_DIR))
    .pipe(writeFile());
}

module.exports = {
  buildMinifiedChunks,
  buildNonMinifiedChunks
};
