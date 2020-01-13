const P = require('path');
const fs = require('fs');
const express = require('express');

const middleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const createWebpackConfig = require('./tools/webpack.config');
const MicroBackends = require('@contentful/micro-backends');

const publicDir = P.resolve(P.resolve('public'));

const app = express();
const config = createWebpackConfig();

async function waitForIndex() {
  try {
    fs.readFileSync(P.resolve(publicDir, 'app', 'index.html'));
  } catch (e) {
    await new Promise(resolve => setTimeout(resolve, 10));

    return waitForIndex();
  }
}

const compiler = webpack(config);
const webpackDevMiddleware = middleware(compiler, {
  publicPath: '/app/',
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
  stats: {
    colors: true,
    modules: false,
    providedExports: false,
    usedExports: false
  },
  writeToDisk: filePath => /index\.html/.test(filePath)
});
const PORT = Number.parseInt(process.env.PORT, 10) || 3001;

app.use(
  '/_microbackends',
  MicroBackends.createMiddleware({
    backendsDir: P.resolve(__dirname, 'micro-backends'),
    isolationType: process.env.MICRO_BACKENDS_ISOLATION_TYPE || 'subprocess'
  })
);

app.use(webpackDevMiddleware);

app.use(express.static(publicDir));
app.get('*', async function(req, res, next) {
  await waitForIndex();

  if (!req.accepts('html')) {
    next();
    return;
  }

  res
    .status(200)
    .type('html')
    .sendFile('index.html', { root: P.join(publicDir, 'app') });
});

app.use(function(_req, res) {
  res.sendStatus(404).end();
});

app.listen(PORT, err => {
  if (err) {
    // eslint-disable-next-line
    console.error(err);

    return;
  }

  // eslint-disable-next-line
  console.log(`\n\nServing application at http://localhost:${PORT}\n\n`);
});
