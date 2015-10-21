// Karma configuration
// Generated on Sat Aug 09 2014 23:18:39 GMT+0200 (CEST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'public/app/vendor.js',
      'public/app/markdown_vendors.js',
      'public/app/templates.js',
      'public/app/user_interface.js',
      'src/javascripts/*.js',
      'src/javascripts/*/**/*.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/sinon/index.js',
      'test/helpers/**/*.js',
      'test/unit/**/*.js',
      'test/integration/**/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['nested'],

    specjsonReporter: {
      outputFile: 'karma-specs.json'
    },

    mochaReporter: {
      ignoreSkipped: true
    },

    // web server port
    port: 9876,

    reportSlowerThan: 500,

    browserNoActivityTimeout: 15000,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_ERROR,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
