#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { sync: rimrafSync } = require('rimraf');
const { build } = require('../webpack-tasks');

const publicDir = path.resolve(__dirname, '..', '..', 'public');
const publicAppDir = path.resolve(publicDir, 'app');
const sourcemapsDir = path.resolve(publicDir, 'sourcemaps');

rimrafSync(publicDir);

build().then(() => {
  let files;

  files = fs.readdirSync(publicAppDir, { withFileTypes: true });

  for (const file of files) {
    // In Webpack 4, empty chunks are emitted, meaning that `favicon-[hash].js` and
    // `styles-[hash].js` are emitted. We manually remove them here.
    //
    // In Webpack 5 this is supposedly fixed, so we can safely remove this code
    // once we upgrade. Fix PR: https://github.com/webpack/webpack/pull/9040
    if (file.isFile() && /(favicons|styles)-[0-9a-f]*\.js/.test(file.name)) {
      fs.unlinkSync(path.resolve(publicAppDir, file.name));
    }
  }

  fs.mkdirSync(sourcemapsDir);

  // This isn't optimal, but since we have deleted some files above, we need to
  // re-read the directory to get the updated files list.
  files = fs.readdirSync(publicAppDir, { withFileTypes: true });

  for (const file of files) {
    // We move the sourcemaps to a separate directory so that they won't be uploaded to S3
    if (file.isFile() && /\.map$/.test(file.name)) {
      const currentPath = path.resolve(publicAppDir, file.name);
      const newPath = path.resolve(sourcemapsDir, file.name);

      fs.renameSync(currentPath, newPath);
    }
  }
});
