const P = require('path');

// Module IDs are relative to this path
const basePath = P.resolve('src', 'javascripts');

const SUPPORTED_BROWSERS = ['last 2 versions', 'ie >= 11'];

module.exports.supportedBrowsers = SUPPORTED_BROWSERS;

/**
 * Return an babel options object used to compile files
 * matching 'src/javascript/**.es6.js.
 *
 * NOTE We use absolute paths to reference the babel plugins and
 * presets. This is required so that we can transpile code in packages
 * that are sym-linked locally (e.g. the ShareJS client).
 *
 * @param {string[]} params.browserTargets
 *   A list of browser targets to transpile to. Used by
 *   `@babel/presets-env`. We use different targets for tests an the
 *   built source code. See the browserlist package[1] for
 *   documentation [1]: https://github.com/ai/browserslist
 * @param {boolean} params.angularModules
 *   If true we transpile all modules as SystemJS modules and register
 *   them with `AngularSystem`. In this case we also resolve all module
 *   IDs
 * @param {object?} opts
 *   Additional options to be merged into the base options.
 * @returns {object}
 */
module.exports.createBabelOptions = function createBabelOptions(options = {}) {
  const { browserTargets = SUPPORTED_BROWSERS, angularModules = true, ...opts } = options;
  return Object.assign(
    {
      moduleIds: true,
      babelrc: false,

      presets: [
        [
          require.resolve('babel-preset-env'),
          {
            targets: {
              browsers: browserTargets
            },
            loose: true,
            debug: true,
            modules: false,
            useBuiltIns: false
          }
        ],
        require.resolve('babel-preset-react')
      ],
      plugins: [
        angularModules && [
          require.resolve('babel-plugin-transform-es2015-modules-systemjs'),
          {
            systemGlobal: 'AngularSystem'
          }
        ],
        require.resolve('babel-plugin-transform-object-rest-spread'),
        require.resolve('babel-plugin-transform-class-properties')
      ].filter(p => !!p),

      getModuleId: angularModules ? getModuleIdInSrc : undefined
    },
    opts
  );

  // Get the SystemJS module ID from the source path
  // src/javascripts/a/b/x.es6.js -> a/b/x
  function getModuleIdInSrc(path) {
    const absPath = P.resolve(path);
    if (absPath.startsWith(basePath)) {
      return absPath.replace(basePath + '/', '');
    } else {
      return path;
    }
  }
};
