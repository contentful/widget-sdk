const gulp = require('gulp');
const path = require('path');
const FS = require('../lib/utils').FS;
const React = require('react');
const ReactDOMServer = require('react-dom/server');

// TODO @babel/register pollutes regular node `require`
// calls, sometime it breaks things.
// It's used only to read JSX files defined below.
// `only` regexp should limit the impact, consider
// finding an alternative.
require('@babel/register')({
  plugins: ['transform-es2015-modules-commonjs'],
  presets: ['@babel/preset-react'],
  only: [/src\/javascripts\/svg/]
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
