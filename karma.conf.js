/* global require module */

const P = require('path');
const express = require('express');

// Test file patterns common to the karma config and the development config

const filesNeededToRunTests = [
  'node_modules/systemjs/dist/system.src.js',
  'test/system-config.js',
  'test/prelude.js',
  'src/javascripts/**/*.js',
  {
    pattern: 'src/javascripts/libs/locales_list.json',
    watched: false,
    served: true,
    included: false
  },
  'test/helpers/**/*.js'
];

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

      'public/app/templates.js',
      'public/app/dependencies.js'
    ].concat(filesNeededToRunTests, ['test/unit/**/*.js', 'test/integration/**/*.js']),

    middleware: ['static'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/helpers/**/*.js': ['babelTest', 'sourcemap'],
      'test/integration/**/*.js': ['babelTest', 'sourcemap'],
      'test/unit/**/*.js': ['babelTest', 'sourcemap'],
      'src/javascripts/**/*.js': ['babelTest', 'sourcemap'],
      'public/app/dependencies.js': ['sourcemap'],
      'vendor/jquery-shim.js': ['babelTest', 'sourcemap']
    },

    customPreprocessors: {
      babelTest: {
        base: 'babel',
        options: {
          moduleIds: true,
          getModuleId: stripRoot,
          babelrc: false,
          ignore: ['test/prelude.js'],
          sourceMap: 'inline',
          presets: [
            [
              '@babel/preset-env',
              {
                loose: true,
                modules: false,
                useBuiltIns: false
              }
            ],
            '@babel/react'
          ],
          plugins: [
            '@babel/transform-modules-systemjs',
            '@babel/proposal-object-rest-spread',
            '@babel/proposal-class-properties',
            '@babel/syntax-dynamic-import'
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
    logLevel: config.LOG_WARN,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    browsers: ['ChromeHeadless'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};

module.exports.filesNeededToRunTests = filesNeededToRunTests;

function stripRoot(path) {
  const rootDir = `${__dirname}/`;
  const srcDir = `${P.resolve(__dirname, 'src', 'javascripts')}/`;

  if (path.startsWith(srcDir)) {
    return path.replace(srcDir, '');
  } else if (path.startsWith(rootDir)) {
    return path.replace(rootDir, '');
  } else {
    return path;
  }
}

function makeSourceFileName(karmaFile) {
  return '/' + stripRoot(karmaFile.originalPath);
}
