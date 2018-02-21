const co = require('co');
const gulp = require('gulp');
const path = require('path');
const FS = require('../lib/utils').FS;
const proxyquire = require('proxyquire');
const h = require('../lib/hyperscript').h;

/**
 * Render some of the SVGs defined as Hyperscript in
 * 'src/javascripts/svg' as SVG files so they can be used as static
 * assets.
 *
 * The SVG files are put into 'public/app/svg'. Once can reference them
 * from stylesheets using `url("/app/svg/my-file.svg")`.
 */
gulp.task('svg', co.wrap(function* () {
  const targetDir = path.resolve('public', 'app', 'svg');
  yield FS.mkdirsAsync(targetDir);

  yield Promise.all([
    'chevron-blue',
    'dd-arrow-down',
    'dd-arrow-down-disabled',
    'dotted-border',
    'logo-label',
    'note-info',
    'note-success',
    'note-warning'
  ].map((icon) => {
    const src = path.resolve('src', 'javascripts', 'svg', icon + '.es6.js');
    const target = path.join(targetDir, icon + '.svg');
    const output = proxyquire.noCallThru()(src, {
      'ui/Framework': {h}
    }).default;
    return FS.writeFile(target, output, 'utf8');
  }));
}));
