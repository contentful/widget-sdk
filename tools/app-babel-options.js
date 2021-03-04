const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Return an babel options object used to transpile files
 *
 * NOTE We use absolute paths to reference the babel plugins and
 * presets. This is required so that we can transpile code in packages
 * that are sym-linked locally (e.g. the ShareJS client).
 *
 * @param {object?} opts
 *   Additional options to be merged into the base options.
 * @returns {object}
 */
module.exports.createBabelOptions = function createBabelOptions(options = {}) {
  const { modules = false, ...opts } = options;

  return {
    babelrc: false,
    presets: [
      [
        require.resolve('@babel/preset-typescript'),
        {
          allExtensions: true,
          isTSX: true,
        },
      ],
      !isProd && [
        require.resolve('@babel/preset-env'),
        {
          loose: false,
          modules: modules,
          useBuiltIns: false,
        },
      ],
      require.resolve('@babel/preset-react'),
    ].filter(Boolean),
    plugins: [
      require.resolve('@babel/plugin-proposal-class-properties'),
      isProd && require.resolve('@babel/plugin-proposal-object-rest-spread'),
      [
        require.resolve('babel-plugin-emotion'),
        {
          // sourceMap is on by default but source maps are dead code eliminated in production
          sourceMap: true,
          autoLabel: process.env.NODE_ENV !== 'production',
          labelFormat: '[local]',
          cssPropOptimization: true,
        },
      ],
      !isProd && !isTest && [require.resolve('react-refresh/babel')],
    ].filter(Boolean),
    ...opts,
  };
};
