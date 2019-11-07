/**
 * @description This is a webpack configuration to process _most_ of the JS files.
 * For example, `templates.js` is created by gulp, as well as all styles.
 *
 * Because of the way our tests are set up – we can import es6 files directly, using
 * `import` syntax, and if imported file uses non-js loader, karma will fail.
 *
 * Hence, styles and templates (written using Jade/Pug) use gulp for processing.
 * However, you can still use custom loader, just avoid requiring non-js files
 * in generic files (otherwise some tests can file).
 *
 * Right now we don't use imports/exports feature of webpack, we just concatenating
 * everything, and use SystemJS to register ES6 dependencies.
 */

const webpack = require('webpack');
const P = require('path');
const { createBabelOptions } = require('./app-babel-options');
const WebpackRequireFrom = require('webpack-require-from');

/**
 * @description webpack's configuration factory
 * @param {boolean} params.dev – if dev is false:
 *   - process.env.NODE_ENV is set to "production"
 *   - we omit moment.js' locales
 *   - global variable IS_PRODUCTION is set to `true`
 *   - source-map is slower, but more extensive
 */
module.exports = () => {
  const currentEnv = process.env.NODE_ENV;
  const isDev = /^(dev|development)$/.test(currentEnv) || !currentEnv;
  const isProd = currentEnv === 'production';
  const isTest = currentEnv === 'test';

  const appEntry = {
    // Main app bundle, with vendor files such as bcsocker and jquery-shim
    'app.js': [
      './vendor/jquery-shim.js',

      // Custom jQuery UI build: see the file for version and contents
      './vendor/jquery-ui/jquery-ui.js',
      './node_modules/bootstrap/js/tooltip.js',
      './vendor/bcsocket-shim.js',
      './src/javascripts/prelude.js'
    ]
  };

  const testDepEntry = {
    // Dependency file, generated for tests (systemJs does not handle require statements
    // at all, making some dependency handling particularly challenging)
    'dependencies.js': ['./build/dependencies-pre.js']
  };

  return {
    entry: Object.assign({}, !isTest ? appEntry : {}, isTest ? testDepEntry : {}),
    output: {
      filename: '[name]',
      path: P.resolve(__dirname, '..', 'public', 'app'),
      publicPath: '/app/',
      chunkFilename: 'chunk_[name]-[chunkhash].js'
    },
    mode: isProd ? 'production' : 'development',
    resolve: {
      modules: ['node_modules', 'src/javascripts'],
      alias: {
        'saved-views-migrator': P.resolve(
          __dirname,
          '..',
          'src',
          'javascripts',
          'libs',
          'saved-views-migrator',
          'index.js'
        )
      }
    },
    module: {
      rules: [
        // this rule is only for ES6 files, we need to use SystemJS plugin to register them
        // and resolve "imported" files correctly (they are transpiled to use Angular DI, so
        // these are not real `import/export`).
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: createBabelOptions({
              compact: isProd
            })
          }
        }
      ]
    },
    plugins: [
      new WebpackRequireFrom({
        methodName: 'WebpackRequireFrom_getChunkURL'
      })
    ].concat(
      // moment.js by default bundles all locales, we want to remove them
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // or just google `moment webpack locales`
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ),
    // Production:
    // We are using `inline-source-map` instead of `source-map` because
    // the latter fails to produce source maps for some files.
    //
    // For production, we process the webpack output with the `build/js`
    // gulp task which concats files and merges source maps. Without
    // inline source maps this tasks fails to generate proper source maps
    //
    // Note that the bundle size for production is unaffected by using
    // inline source maps since the gulp task extracts and removes the
    // inline comments and creates a separate source map file.
    //
    // Development:
    // We are using `cheap-module-source-map` as this allows us to see
    // errors and stack traces with Karma rather than just "Script error".
    devtool: isDev ? 'cheap-module-source-map' : 'inline-source-map',
    optimization: {
      minimize: false,
      chunkIds: isDev ? 'named' : false,
      splitChunks: {
        // TODO: Make this a bit cleaner
        cacheGroups: !isTest
          ? {
              app: {
                name: 'main',
                test: (_, chunks) => {
                  if (chunks[0] && chunks[0].name === 'app.js') {
                    return false;
                  }

                  // If any of the chunks that would be generated contain a `src/javascripts` file,
                  // include them in this bundle.
                  if (anyChunkHasSrcJavascripts(chunks)) {
                    return true;
                  }

                  // Do not include anything else in this bundle.
                  return false;
                },
                chunks: 'all'
              }
            }
          : {}
      }
    },
    stats: {
      // Set the maximum number of modules to be shown
      maxModules: 1
    }
  };
};

function anyChunkHasSrcJavascripts(chunks) {
  return Boolean(
    chunks.find(chunk => {
      const chunkModules = Array.from(chunk._modules);

      return chunkModules.find(_module => {
        return _module.userRequest && _module.userRequest.split('/src/javascripts/').length !== 1;
      });
    })
  );
}
