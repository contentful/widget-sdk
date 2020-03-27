const path = require('path');
const express = require('express');

const middleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const createWebpackConfig = require('./tools/webpack.config');
const MicroBackends = require('@contentful/micro-backends');
const { render: renderIndex } = require('./tools/lib/index-page');

const publicDir = path.resolve(__dirname, 'public');

// Index page generation

const configName = process.env.UI_CONFIG || 'development';
const indexConfig = require(path.join(__dirname, 'config', `${configName}.json`));

// Generate the development index page
//
// In development, assets are not fingerprinted and are
// always are `/app/<asset name>`, and so we can pass in
// an object that never changes.
const indexPage = renderIndex(null, indexConfig, {
  'app.js': '/app/app.js',
  'vendors~app.js': '/app/vendors~app.js',
  'styles.css': '/app/styles.css',
  'assets/favicon32x32.png': '/app/assets/favicon32x32.png',
  'assets/apple_icon57x57.png': '/app/assets/apple_icon57x57.png',
  'assets/apple_icon72x72.png': '/app/assets/apple_icon72x72.png',
  'assets/apple_icon114x114.png': '/app/assets/apple_icon114x114.png',
});

// Server configuration

const app = express();
const config = createWebpackConfig();

const compiler = webpack(config);
const webpackDevMiddleware = middleware(compiler, {
  publicPath: '/app/',
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000,
  },
  stats: {
    colors: true,
    modules: false,
    providedExports: false,
    usedExports: false,
  },
});

const PORT = Number.parseInt(process.env.PORT, 10) || 3001;

app.use(
  '/_microbackends',
  MicroBackends.createMiddleware({
    backendsDir: path.resolve(__dirname, 'micro-backends'),
    isolationType: process.env.MICRO_BACKENDS_ISOLATION_TYPE || 'subprocess',
  })
);

app.use(webpackDevMiddleware);

app.use(express.static(publicDir));
app.get('*', async function (req, res, next) {
  // If the request is for a non-html page (e.g. a JS or CSS file)
  // continue to the next middleware
  if (!req.accepts('html')) {
    next();
    return;
  }

  // Render the index page otherwise
  res.status(200).type('html').end(indexPage);
});

app.use(function (_req, res) {
  res.sendStatus(404).end();
});

app.listen(PORT, (err) => {
  if (err) {
    // eslint-disable-next-line
    console.error(err);

    return;
  }

  // eslint-disable-next-line
  console.log(`\n\nServing application at http://localhost:${PORT}\n\n`);
});
