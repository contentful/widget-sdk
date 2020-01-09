#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { sync: rimrafSync } = require('rimraf');
const { build } = require('../webpack-tasks');

const projectRoot = path.resolve(__dirname, '..', '..');

rimrafSync(path.resolve(projectRoot, 'public'));
rimrafSync(path.resolve(projectRoot, 'build'));

build().then(() => {
  // Remove any files in public/app that do not end with .js or .css
  //
  // We do this to simplify things later -- we can simply copy `public` completely -- and
  // because our Webpack config also processes images and CSS outside of a JS file. This
  // creates empty output files, which we don't care about and waste space in a prod Docker
  // build.
  fs.readdirSync(path.resolve(projectRoot, 'public', 'app'), { withFileTypes: true }).forEach(
    file => {
      if (file.isFile() && !file.name.endsWith('.js') && !file.name.endsWith('.css')) {
        fs.unlinkSync(path.resolve(projectRoot, 'public', 'app', file.name));
      }
    }
  );
});
