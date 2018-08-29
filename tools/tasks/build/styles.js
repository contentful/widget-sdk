const gulp = require('gulp');
const createManifestResolver = require('../../lib/manifest-resolver').create;
const sourceMaps = require('gulp-sourcemaps');
const {
  writeFile,
  removeSourceRoot,
  mapSourceMapPaths,
  mapFileContents,
  changeBase
} = require('../helpers');
const rework = require('rework');
const reworkUrlRewrite = require('rework-plugin-url');
const path = require('path');
const rev = require('gulp-rev');

/**
 * Copy the application’s main JS and CSS files from `public/app` to
 * `build` and create a manifest for them.
 *
 * - Replaces references to assets with their fingerprinted version
 *   from the `rev-static` manifest.
 *
 * - Extracts source maps contained in the files and writes them
 *   to a separate `.maps` file.
 */
gulp.task('build/styles', ['build/static', 'stylesheets'], function() {
  const staticManifest = require('../../../build/static-manifest.json');
  const manifestResolver = createManifestResolver(staticManifest, '/app');
  return (
    gulp
      .src(['public/app/main.css', 'public/app/vendor.css'], { base: 'public' })
      .pipe(sourceMaps.init({ loadMaps: true }))
      .pipe(removeSourceRoot())
      .pipe(
        mapSourceMapPaths(function(src) {
          // `gulp-sourcemaps` prepends 'app' to all the paths because that
          // is the base. But we want the path relative to the working dir.
          return path.relative('app', src);
        })
      )
      .pipe(
        mapFileContents(function(contents, file) {
          return rework(contents, { source: file.path })
            .use(reworkUrlRewrite(manifestResolver))
            .toString({ compress: true, sourcemaps: true });
        })
      )
      // Need to reload the source maps because 'rework' inlines them.
      .pipe(sourceMaps.init({ loadMaps: true }))
      .pipe(changeBase('build'))
      .pipe(writeFile())
      .pipe(rev())
      .pipe(writeFile())
      .pipe(sourceMaps.write('.', { sourceRoot: '/' }))
      .pipe(writeFile())
      .pipe(rev.manifest('build/styles-manifest.json'))
      .pipe(writeFile())
  );
});
