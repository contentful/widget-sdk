const P = require('path');

// Module IDs are relative to this path
const basePath = P.resolve('src', 'javascripts');

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
module.exports.makeOptions = function makeOptions ({ browserTargets }, opts) {
  return Object.assign({
    moduleIds: true,
    only: /\.es6\.js$/,
    babelrc: false,

    presets: [
      ['env', {
        'targets': {
          'browsers': browserTargets
        },
        'loose': true,
        'debug': true,
        'modules': false,
        // TODO we want to use 'useBuiltIns': 'entry' to reduce bundle size,
        // but first we heed to pipe `libs/index` through babel.
        'useBuiltIns': false
      }], 'react'
    ],
    plugins: [
      ['transform-es2015-modules-systemjs', {
        systemGlobal: 'AngularSystem'
      }],
      'transform-object-rest-spread'
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
