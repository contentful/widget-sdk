#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const sourceDir = path.resolve(__dirname, '..', '..', 'src', 'javascripts', 'svg');

require('@babel/register')({
  moduleIds: true,
  babelrc: false,
  presets: [
    [
      require.resolve('@babel/preset-env'),
      {
        loose: true,
        useBuiltIns: false
      }
    ],
    require.resolve('@babel/preset-react')
  ],
  plugins: [
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-syntax-dynamic-import'),
    [
      'emotion',
      {
        // sourceMap is on by default but source maps are dead code eliminated in production
        sourceMap: true,
        autoLabel: process.env.NODE_ENV !== 'production',
        labelFormat: '[local]',
        cssPropOptimization: true
      }
    ]
  ],
  only: [/src\/javascripts\/svg/]
});

fs.readdirSync(sourceDir).forEach(name => {
  const resolved = path.resolve(sourceDir, name);

  if (!resolved.endsWith('.js')) {
    return;
  }

  const newFilename = `${resolved.split('.js')[0]}.svg`;

  return fs.writeFileSync(
    newFilename,
    ReactDOMServer.renderToString(React.createElement(require(resolved).default)).replace(/ data-reactroot=""/g, ''),
    'utf8'
  );
});
