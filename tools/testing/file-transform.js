/* eslint-disable no-unused-vars */

'use strict';

const path = require('path');

// This is a custom Jest transformer turning file imports into filenames.
module.exports = {
  process(src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));
    return `module.exports = ${assetFilename};`;
  }
};
