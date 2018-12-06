'use strict';

/*
  This file is for libraries only for tests, such as `enzyme`.

  In development and testing, the `prod.js` libs plus these are loaded.
 */

window.libs = window.libs.concat([
  ['enzyme', require('enzyme')],
  ['enzyme-adapter-react-16', require('enzyme-adapter-react-16')],

  ['react-dom/test-utils', require('react-dom/test-utils')],

  ['sinon', require('sinon')],
  ['moment', require('moment')],
  ['angular-mocks', require('angular-mocks')]
]);
