const P = require('path');
const { omit } = require('lodash');

// Module IDs are relative to this path
const basePath = P.resolve('src', 'javascripts');

const SUPPORTED_BROWSERS = ['last 2 versions', 'ie >= 11'];

module.exports.supportedBrowsers = SUPPORTED_BROWSERS;

/**
 * Return an babel options object used to compile files
 * matching 'src/javascript/**.es6.js.
 *
 * @param {string[]} params.browserTargets
 *   A list of browser targets to transpile to. Used by
 *   `@babel/presets-env`. We use different targets for tests an the
 *   built source code. See the browserlist package[1] for
 *   documentation [1]: https://github.com/ai/browserslist
 * @param {object?} opts
 *   Additional options to be merged into the base options.
 * @returns {object}
 */
module.exports.createBabelOptions = function createBabelOptions (options = {}) {
  const { browserTargets = SUPPORTED_BROWSERS } = options;
  const opts = omit(options, ['browserTargets']);
  return Object.assign({
    moduleIds: true,
    babelrc: false,

    presets: [
      ['env', {
        'targets': {
          'browsers': browserTargets
        },
        'loose': true,
        'debug': true,
        'modules': false,
        'useBuiltIns': false
      }], 'react'
    ],
    plugins: [
      ['transform-es2015-modules-systemjs', {
        systemGlobal: 'AngularSystem'
      }],
      'transform-object-rest-spread',
      'transform-class-properties'
    ],

    // Get the SystemJS module ID from the source path
    // src/javascripts/a/b/x.es6.js -> a/b/x
    getModuleId: function (path) {
      const absPath = P.resolve(path);
      if (absPath.startsWith(basePath)) {
        return absPath
          .replace(/\.es6$/, '')
          .replace(basePath + '/', '');
      } else {
        return path;
      }
    }
  }, opts);
};
