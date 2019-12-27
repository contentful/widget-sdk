const gulp = require('gulp');
const rev = require('gulp-rev');

const { changeBase, writeFile } = require('../helpers');

function processStaticPublic() {
  const publicFiles = ['public/app/app.js', 'public/app/styles.css'];

  return gulp
    .src(publicFiles, { base: 'public' })
    .pipe(changeBase('build'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/public-manifest.json'))
    .pipe(writeFile());
}

function processStaticSrc() {
  const srcFiles = [
    // These images are required in the index page, but the index page
    // isn't built by Webpack yet, so they are included here manually.
    'src/images/favicons/favicon32x32.png',
    'src/images/favicons/apple_icon57x57.png',
    'src/images/favicons/apple_icon72x72.png',
    'src/images/favicons/apple_icon114x114.png'
  ];

  return gulp
    .src(srcFiles, { base: 'src/images' })
    .pipe(changeBase('build/app'))
    .pipe(rev())
    .pipe(writeFile())
    .pipe(rev.manifest('build/src-manifest.json'))
    .pipe(writeFile());
}

/**
 * Copy all non-JS and non-CSS files from `public/app` to `build` and
 * create a manifest for them.
 */
module.exports = gulp.parallel(processStaticPublic, processStaticSrc);
