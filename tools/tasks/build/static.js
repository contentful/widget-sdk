const path = require('path');
const gulp = require('gulp');
const rev = require('gulp-rev');

const streamUtils = require('../../lib/stream-utils');
const { changeBase, writeFile } = require('../helpers');

function copyChunks() {
  const files = ['public/app/chunk_*.js'];

  return gulp
    .src(files, { base: 'public' })
    .pipe(changeBase('build'))
    .pipe(writeFile());
}

function createMainCss() {
  return gulp
    .src(['public/app/styles.css'])
    .pipe(
      streamUtils.map(file => {
        const base = path.resolve('build');
        const filePath = path.join(base, 'app', 'main.css');

        file.base = base;
        file.path = filePath;
        return file;
      })
    )
    .pipe(writeFile());
}

function processStaticPublic() {
  const files = ['public/app/app.js', 'public/app/styles.css'];

  return gulp
    .src(files, { base: 'public' })
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/public-manifest.json'))
    .pipe(writeFile());
}

function moveSrcImages() {
  const files = [
    // These images are required in the index page, but the index page
    // isn't built by Webpack yet, so they are included here manually.
    'src/images/favicons/favicon32x32.png',
    'src/images/favicons/apple_icon57x57.png',
    'src/images/favicons/apple_icon72x72.png',
    'src/images/favicons/apple_icon114x114.png'
  ];

  return gulp.src(files, { base: 'src/images/favicons' }).pipe(gulp.dest('public/app/assets'));
}

function processSrcImages() {
  const files = [
    // These images are required in the index page, but the index page
    // isn't built by Webpack yet, so they are included here manually.
    'public/app/assets/favicon32x32.png',
    'public/app/assets/apple_icon57x57.png',
    'public/app/assets/apple_icon72x72.png',
    'public/app/assets/apple_icon114x114.png'
  ];

  return gulp
    .src(files, { base: 'public' })
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/src-manifest.json'))
    .pipe(writeFile());
}

function copyAssets() {
  const assets = ['public/app/assets/**/*'];

  return gulp
    .src(assets, { base: 'public/app/assets' })
    .pipe(changeBase('build/app/assets'))
    .pipe(writeFile());
}

module.exports = gulp.parallel(
  processStaticPublic,
  copyChunks,
  createMainCss,
  gulp.series(moveSrcImages, processSrcImages, copyAssets)
);
