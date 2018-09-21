'use strict';

/*
  This file is for libraries only for development, such as `enzyme`.

  In development both these libraries and those listed in `prod.js` are loaded.
 */

window.libs = window.libs.concat([
  ['enzyme', require('enzyme')],
  ['enzyme-adapter-react-16', require('enzyme-adapter-react-16')],

  ['react-dom/test-utils', require('react-dom/test-utils')]
]);
