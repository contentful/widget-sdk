'use strict';

var dottie = require('dottie');
var NOTHING = {};

module.exports = {
  get: dottie.get,
  put: dottie.set,
  exists: exists
};

function exists(obj, path) {
  return dottie.get(obj, path, NOTHING) !== NOTHING;
}
