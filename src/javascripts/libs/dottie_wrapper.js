'use strict';

var dottie = require('dottie');
var NOTHING = {};

module.exports = {
  get: get,
  put: dottie.set,
  transform: dottie.transform,
  flatten: dottie.flatten,
  exists: exists
};

function exists (obj, path) {
  return dottie.get(obj, path, NOTHING) !== NOTHING;
}

function get (obj, path, def) {
  if (path && typeof path.slice === 'function') {
    path = path.slice();
  }

  return dottie.get(obj, path, def);
}
