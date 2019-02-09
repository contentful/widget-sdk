const P = require('path');

// Module IDs are relative to this path
const basePath = P.resolve('src', 'javascripts');

/**
 * Return an babel options object used to compile files
 * matching 'src/javascript/**.es6.js.
 *
 * NOTE We use absolute paths to reference the babel plugins and
 * presets. This is required so that we can transpile code in packages
 * that are sym-linked locally (e.g. the ShareJS client).
 *
 * @param {boolean} params.angularModules
 *   If true we transpile all modules as SystemJS modules and register
 *   them with `AngularSystem`. In this case we also resolve all module
 *   IDs
 * @param {object?} opts
 *   Additional options to be merged into the base options.
 * @returns {object}
 */
module.exports.createBabelOptions = function createBabelOptions(options = {}) {
  const { angularModules = true, modules = false, ...opts } = options;
  return Object.assign(
    {
      moduleIds: true,
      babelrc: false,
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            loose: true,
            modules: modules,
            useBuiltIns: false
          }
        ],
        require.resolve('@babel/preset-react')
      ],
      plugins: [
        angularModules && [
          require.resolve('@babel/plugin-transform-modules-systemjs'),
          {
            systemGlobal: 'AngularSystem'
          }
        ],
        require.resolve('@babel/plugin-proposal-object-rest-spread'),
        require.resolve('@babel/plugin-proposal-class-properties'),
        [
          'emotion',
          {
            // sourceMap is on by default but source maps are dead code eliminated in production
            sourceMap: true,
            autoLabel: process.env.NODE_ENV !== 'production',
            labelFormat: '[local]',
            cssPropOptimization: true
          }
        ]
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
