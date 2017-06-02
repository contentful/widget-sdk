/* global require module */

require('babel-register');

var base = require('./karma.conf.js');

module.exports = function (config) {
  base(config);
  config.set({
    files: [
      'build/app/**/*.js'
    ].concat(base.testFiles),

    reporters: ['dots'],
    singleRun: true
  });
};
