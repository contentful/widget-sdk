// Karma configuration
// Generated on Sat Aug 09 2014 23:18:39 GMT+0200 (CEST)

require('babel-register');

var base = require('./karma.conf.js');

module.exports = function (config) {
  base(config);
  config.set({
    files: [
      'build/app/**/*.js',

      // Test libraries
      'bower_components/angular-mocks/angular-mocks.js',
      'node_modules/sinon/pkg/sinon.js',

      'test/helpers/**/*.js',
      'test/unit/**/*.js',
      'test/integration/**/*.js',

      // Vendored scripts
      {pattern: 'vendor/ui-extensions-sdk/dist/cf-extension-api.js', included: false}
    ],

    reporters: ['dots'],
    browsers: ['SlimerJS'],
    singleRun: true
  });
};
