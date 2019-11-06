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

module.exports = {
  buildMinifiedChunks
};
