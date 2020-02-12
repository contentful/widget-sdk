#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { sync: rimrafSync } = require('rimraf');
const { build } = require('../webpack-tasks');

const publicDir = path.resolve(__dirname, '..', '..', 'public');
const publicAppDir = path.resolve(publicDir, 'app');

rimrafSync(publicDir);

build().then(() => {
  // In Webpack 4, empty chunks are emitted, meaning that `favicon-[hash].js` and
  // `styles-[hash].js` are emitted. We manually remove them here.
  //
  // In Webpack 5 this is supposedly fixed, so we can safely remove this code
  // once we upgrade. Fix PR: https://github.com/webpack/webpack/pull/9040
  const files = fs.readdirSync(publicAppDir, { withFileTypes: true });

  for (const file of files) {
    if (file.isFile() && /(favicons|styles)-[0-9a-f]*\.js/.test(file.name)) {
      fs.unlinkSync(path.resolve(publicAppDir, file.name));
    }
  }
});
