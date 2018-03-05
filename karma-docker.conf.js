/* global require module */

var base = require('./karma.conf.js');

module.exports = function (config) {
  base(config);
  config.set({
    files: [
      'build/app/**/*.js',
      'build/app/**/*.css'
    ].concat(base.testFiles),

    reporters: ['dots'],
    singleRun: true,

    // Fix for https://crbug.com/638180: Running as root without --no-sandbox is not supported
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    }
  });
};
