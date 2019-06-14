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
const globSync = require('glob').sync;
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

  return {
    entry: {
      // we have 3 entries mostly due to historical reasons and to avoid
      // rewriting how our gulp build process is made
      'components.js': [
        './src/javascripts/sharejs-types.js',
        './src/javascripts/prelude.js'
      ].concat(
        // we have to get all JS files, because we use Angular DI system
        // and don't import other files directly
        //
        // with globSync, we inline all javascript file names into an array
        // it has two consequences:
        // 1. if we add new file, it is not automatically picked up by webpack
        // (unless we import it normal way, but we don't do that)
        // 2. if you remove an existing file, webpack will break – you are not
        // supposed to remove entry files
        globSync('./src/javascripts/**/*.js', {
          ignore: [
            './src/javascripts/libs/*.js',
            './src/javascripts/prelude.js',
            './src/javascripts/sharejs-types.js',
            './src/javascripts/**/*.spec.js',
            './src/javascripts/__mocks__/**'
          ]
        })
      ),

      // The main libraries file, used for the production build (see /tools/tasks/build/js.js)
      'libs.js': ['./src/javascripts/libs/env-prod.js'],

      // The libraries file used for our Karma tests
      //
      // See:
      // - karma.conf.js
      // - tools/tasks/build/js.js
      // - run-tests.js
      'libs-test.js': ['./src/javascripts/libs/env-prod.js', './src/javascripts/libs/env-test.js'],
      // some of the vendor files provide some sort of shims
      // the reason – in some files we rely on globals, which is not really
      // how webpack was designed :)
      'vendor.js': [
        './vendor/jquery-shim.js',
        // Custom jQuery UI build: see the file for version and contents
        './vendor/jquery-ui/jquery-ui.js',
        './node_modules/angular/angular.js',
        './node_modules/angular-animate/angular-animate.js',
        './node_modules/angular-sanitize/angular-sanitize.js',
        './node_modules/angular-ui-sortable/dist/sortable.js',
        './node_modules/angular-ui-router/release/angular-ui-router.js',
        './node_modules/bootstrap/js/tooltip.js',
        './vendor/bcsocket-shim.js'
      ]
    },
    output: {
      filename: '[name]',
      path: P.resolve(__dirname, '..', 'public', 'app'),
      publicPath: '/app/',
      chunkFilename: 'chunk_[name]_[contenthash].js'
    },
    mode: isProd ? 'production' : 'development',
    module: {
      rules: [
        // this rule is only for ES6 files, we need to use SystemJS plugin to register them
        // and resolve "imported" files correctly (they are transpiled to use Angular DI, so
        // these are not real `import/export`).
        {
          test: /\.es6.js$/,
          exclude: /(node_modules|vendor)/,
          use: {
            loader: 'babel-loader',
            options: createBabelOptions()
          }
        },
        // The sharejs client is provided as a package of ESnext
        // modules. We also need to transpile it.
        // We also need to transpile our (@contentful) dependencies
        // and their @contentful dependencies.
        // Many of these are shared between front-end/back-end and are liable
        // to be exported directly as node packages (complete with es6).
        {
          // TODO: consider transpiling all dependencies to avoid non-ES5 code, specially for IE
          test: /sharejs\/lib\/client|node_modules\/json0-ot-diff|node_modules\/@contentful.+.js$/,
          exclude: function(path) {
            const isContentful = /node_modules\/@contentful/.test(path);
            const isContentfulDependency = path.split('/@contentful/').length - 1 > 1;

            if (isContentful && isContentfulDependency) {
              return false;
            }

            return /node_modules\/@contentful\/[^/]+\/node_modules/.test(path);
          },
          use: {
            loader: 'babel-loader',
            options: createBabelOptions({ angularModules: false })
          }
        },
        // normal es5 files don't have to be wrapped into SystemJS wrapper
        // it means that imports/exports are not mangled, and if you use them, they will
        // work properly
        {
          // we need to process only es5 files, so pure regex would be too complicated
          test: function(path) {
            // explicitly avoid es6 files
            if (/\.es6.js$/.test(path)) {
              return false;
            }

            return /\.js$/.test(path);
          },
          exclude: /(node_modules|vendor)/,
          use: {
            loader: 'babel-loader',
            options: createBabelOptions({
              angularModules: false,
              moduleIds: false
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
      // we minify all JS files after concatenation in `build/js` gulp task
      // so we don't need to uglify it here
      minimize: false
    },
    stats: {
      // Set the maximum number of modules to be shown
      maxModules: 1
    }
  };
};
