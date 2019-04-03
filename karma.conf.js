/* global require module */

const P = require('path');
const root = P.resolve() + '/';
const express = require('express');

module.exports = function(config) {
  config.plugins.push(
    // Serve static files from root directory under /base
    // Using the files array is too much overhead for files that are
    // not loaded eagerly
    {
      'middleware:static': [
        'factory',
        function() {
          return express().use('/base', express.static(__dirname));
        }
      ]
    }
  );

  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      // We include the CSS files so that we can test visibility, etc.
      // set by CSS.
      // We also need this to make sure that transition events are
      // triggered properly.
      'public/app/vendor.css',
      'public/app/main.css',

      'public/app/vendor.js',
      'public/app/templates.js',
      'public/app/libs-test.js',
      // we load bundled file, it is processed by webpack and contains all
      // modules. it allows us to use any custom loaders
      // it also means that this file should already exist, so you can either
      // build it in advance, or run with webpack in parallel
      'public/app/components.js'
    ].concat(filesNeededToRunTests, ['test/unit/**/*.js', 'test/integration/**/*.js']), // eslint-disable-line

    middleware: ['static'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/helpers/**/*.js': ['babelTest', 'sourcemap'],
      'test/integration/**/*.js': ['babelTest', 'sourcemap'],
      'test/unit/**/*.js': ['babelTest', 'sourcemap'],
      'public/app/*.js': ['sourcemap']
    },

    customPreprocessors: {
      babelTest: {
        base: 'babel',
        options: {
          moduleIds: true,
          getModuleId: stripRoot,
          babelrc: false,
          sourceMap: 'inline',
          presets: ['@babel/env', '@babel/react'],
          plugins: [
            [
              '@babel/transform-modules-systemjs',
              {
                systemGlobal: 'SystemTest'
              }
            ],
            '@babel/proposal-object-rest-spread',
            '@babel/proposal-class-properties'
          ]
        },
        sourceFileName: makeSourceFileName
      }
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],

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
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    browsers: ['ChromeHeadless'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};

// Test file patterns common to the karma config and the development config
const filesNeededToRunTests = (module.exports.filesNeededToRunTests = [
  'node_modules/systemjs/dist/system.src.js',
  'test/prelude.js',

  'test/helpers/**/*.js'
]);

function stripRoot(path) {
  if (path.startsWith(root)) {
    return path.replace(root, '');
  } else {
    return path;
  }
}

function makeSourceFileName(karmaFile) {
  return '/' + stripRoot(karmaFile.originalPath);
}
