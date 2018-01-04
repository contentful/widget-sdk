/* global require module */

require('babel-register');
var makeBabelOptions = require('./tools/app-babel-options').makeOptions;
var P = require('path');
var root = P.resolve() + '/';
var express = require('express')

module.exports = function (config) {

  config.plugins.push(
    // Serve static files from root directory under /base
    // Using the files array is too much overhead for files that are
    // not loaded eagerly
    {'middleware:static': ['factory', function () {
      return express().use('/base', express.static(__dirname));
    }]}
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
      'public/app/libs.js',
      'src/javascripts/prelude.js',
      'public/app/main.css',
      'src/javascripts/**/*.js'
    ].concat(testFiles),

    // list of files to exclude
    exclude: [
      'src/javascripts/libs/**/*.js'
    ],

    middleware: ['static'],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/**/*.es6.js': ['babelApp', 'sourcemap'],
      'test/**/*.js': ['babelTest', 'sourcemap']
    },

    customPreprocessors: {
      babelApp: {
        base: 'babel',
        options: makeBabelOptions({
          // Keep the transpilation and source map effort low by
          // targeting only chrome
          browserTargets: ['last 2 Chrome versions']
        }, {
          sourceMap: 'inline',
          // Since we strip the '.es6.js' extension from the filename we
          // do not need to match /.es6.js/. This is done by the
          // preprocessor glob.
          only: null
        }),
        filename: function (file) {
          return file.originalPath
            .replace(/\.es6\.js$/, '.js');
        },
        sourceFileName: makeSourceFileName
      },
      babelTest: {
        base: 'babel',
        options: {
          moduleIds: true,
          getModuleId: stripRoot,
          babelrc: false,
          sourceMap: 'inline',
          ignore: ['test/prelude.js', 'test/system-config.js'],
          plugins: [
            ['transform-es2015-modules-systemjs', {
              systemGlobal: 'SystemTest'
            }],
            'transform-object-rest-spread'
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
var testFiles = module.exports.testFiles = [
  'node_modules/systemjs/dist/system.src.js',
  'test/system-config.js',
  'test/prelude.js',

  'test/helpers/**/*.js',
  'test/unit/**/*.js',
  'test/integration/**/*.js'
];

function stripRoot (path) {
  if (path.startsWith(root)) {
    return path.replace(root, '');
  } else {
    return path;
  }
}

function makeSourceFileName (karmaFile) {
  return '/' + stripRoot(karmaFile.originalPath);
}
