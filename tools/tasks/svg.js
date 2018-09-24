const gulp = require('gulp');
const path = require('path');
const FS = require('../lib/utils').FS;
const React = require('react');
const ReactDOMServer = require('react-dom/server');
require('babel-register')({
  plugins: ['transform-es2015-modules-commonjs'],
  presets: ['babel-preset-react']
});

/**
 * Render some of the SVGs defined as Hyperscript in
 * 'src/javascripts/svg' as SVG files so they can be used as static
 * assets.
 *
 * The SVG files are put into 'public/app/svg'. Once can reference them
 * from stylesheets using `url("/app/svg/my-file.svg")`.
 */
gulp.task('svg', async function() {
  const targetDir = path.resolve('public', 'app', 'svg');
  await FS.mkdirsAsync(targetDir);

  return Promise.all(
    [
      'chevron-blue',
      'dd-arrow-down',
      'dd-arrow-down-disabled',
      'dotted-border',
      'logo-label',
      'chart-symbol-circle',
      'chart-symbol-diamond',
      'chart-symbol-triangle',
      'note-info',
      'note-success',
      'note-warning'
    ].map(icon => {
      const Component = require(path.resolve('src', 'javascripts', 'svg', icon + '.es6.js'))
        .default;
      const target = path.join(targetDir, icon + '.svg');
      return FS.writeFile(
        target,
        ReactDOMServer.renderToString(React.createElement(Component)),
        'utf8'
      );
    })
  );
});
